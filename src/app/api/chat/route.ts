import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { tools, executeTool } from './tools';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

const SYSTEM_PROMPT = `You are the AI assistant for General Strategy's Command Center. You help manage the kanban board, outreach CRM, vault, and reminders.

You have access to tools that let you:
- View and manage the kanban board (create cards, update cards, move between columns)
- View and manage outreach contacts (create contacts, update status, add notes)
- View and manage the vault (create entries for links, notes, documents, credentials)
- Set and manage reminders

When a user tells you about a conversation or meeting:
1. Create or update the contact in outreach
2. Add notes about what was discussed
3. Set any follow-up reminders
4. Create kanban cards for any action items that come up

When creating reminders, always use YYYY-MM-DD format for dates.
When the user mentions team members, use list_team_members to find their IDs.
When creating cards, use list_board first to find the right column ID.

Be concise and action-oriented. After taking actions, summarize what you did.
Today's date is ${new Date().toISOString().slice(0, 10)}.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages,
    ];

    let response = await client.chat.completions.create({
      model: process.env.LLM_MODEL || 'MiniMax-Text-01',
      messages: chatMessages,
      tools,
      max_tokens: 4096,
    });

    // Tool call loop - keep executing tools until the model gives a final response
    while (response.choices[0]?.message?.tool_calls?.length) {
      const assistantMessage = response.choices[0].message;
      chatMessages.push(assistantMessage as OpenAI.ChatCompletionMessageParam);

      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls!) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (toolCall as any).function;
        const args = JSON.parse(fn.arguments);
        const result = await executeTool(fn.name, { ...args, _userId: userId });
        chatMessages.push({
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Get next response
      response = await client.chat.completions.create({
        model: process.env.LLM_MODEL || 'MiniMax-Text-01',
        messages: chatMessages,
        tools,
        max_tokens: 4096,
      });
    }

    const content = response.choices[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
