'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileViewerProps {
  url: string;
  filename: string;
  className?: string;
}

function getFileType(filename: string): 'pdf' | 'html' | 'docx' | 'image' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'docx') return 'docx';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'unknown';
}

function extractExtFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split('.').pop()?.toLowerCase() || '';
  } catch {
    return '';
  }
}

export default function FileViewer({ url, filename, className }: FileViewerProps) {
  const ext = extractExtFromUrl(url) || filename.split('.').pop()?.toLowerCase() || '';
  const fileType = getFileType(filename || `file.${ext}`);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileType === 'docx') {
      setLoading(true);
      setError(null);
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(async (buffer) => {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          setDocxHtml(result.value);
        })
        .catch(err => {
          console.error('Failed to parse DOCX:', err);
          setError('Failed to load document');
        })
        .finally(() => setLoading(false));
    }
  }, [url, fileType]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-secondary rounded-lg', className)}>
        <Loader2 size={20} className="animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 bg-secondary rounded-lg gap-2', className)}>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
          <ExternalLink size={14} /> Open in new tab
        </Button>
      </div>
    );
  }

  switch (fileType) {
    case 'pdf':
      return (
        <iframe
          src={url}
          className={cn('w-full rounded-lg border border-border', className)}
          style={{ minHeight: 500 }}
          title={filename}
        />
      );

    case 'html':
      return (
        <iframe
          src={url}
          className={cn('w-full rounded-lg border border-border bg-white', className)}
          style={{ minHeight: 500 }}
          sandbox="allow-same-origin"
          title={filename}
        />
      );

    case 'docx':
      if (!docxHtml) return null;
      return (
        <div
          className={cn('tiptap text-sm bg-card border border-border rounded-lg p-6 overflow-y-auto', className)}
          style={{ minHeight: 200, maxHeight: 600 }}
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      );

    case 'image':
      return (
        <div className={cn('rounded-lg border border-border overflow-hidden bg-secondary', className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={filename} className="max-w-full h-auto" />
        </div>
      );

    default:
      return (
        <div className={cn('flex flex-col items-center justify-center p-8 bg-secondary rounded-lg gap-3', className)}>
          <FileText size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
          <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
            <ExternalLink size={14} /> Open in new tab
          </Button>
        </div>
      );
  }
}
