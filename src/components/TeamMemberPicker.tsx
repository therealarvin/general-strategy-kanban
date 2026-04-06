"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { TeamMember } from "@/types";

interface TeamMemberPickerProps {
  userId: string;
  onComplete: () => void;
}

export default function TeamMemberPicker({
  userId,
  onComplete,
}: TeamMemberPickerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, initials, color")
        .order("name");

      if (error) {
        setError("Failed to load team members.");
        setLoading(false);
        return;
      }

      setMembers(data ?? []);
      setLoading(false);
    }

    fetchMembers();
  }, []);

  async function handleSelect(member: TeamMember) {
    setSelectedId(member.id);
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        team_member_id: member.id,
        display_name: member.name,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      setError("Failed to save profile. Please try again.");
      setSaving(false);
      setSelectedId(null);
      return;
    }

    onComplete();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle
            className="font-serif text-2xl"
            style={{ color: "#b8a07a" }}
          >
            Welcome to General Strategy
          </CardTitle>
          <CardDescription className="text-foreground/60">
            Select your team member profile
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          {loading && (
            <p className="text-center text-sm text-muted-foreground">
              Loading team members...
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          {!loading &&
            members.map((member) => (
              <Button
                key={member.id}
                variant="outline"
                className="h-auto justify-start gap-3 px-4 py-3"
                disabled={saving}
                onClick={() => handleSelect(member)}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </span>
                <span className="font-serif text-base text-foreground">
                  {member.name}
                </span>
                {saving && selectedId === member.id && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </Button>
            ))}

          {!loading && members.length === 0 && !error && (
            <p className="text-center text-sm text-muted-foreground">
              No team members found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
