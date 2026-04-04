'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2, ExternalLink, Code, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileViewerProps {
  url: string;
  filename: string;
  className?: string;
}

type FileType = 'pdf' | 'html' | 'docx' | 'image' | 'unknown';

function detectFileType(url: string, filename: string): FileType {
  // Try URL extension first (most reliable)
  try {
    const urlPath = new URL(url).pathname;
    const urlExt = urlPath.split('.').pop()?.toLowerCase();
    if (urlExt) {
      const type = extToType(urlExt);
      if (type !== 'unknown') return type;
    }
  } catch {}

  // Try filename - strip parenthetical size info like "(19.7 KB)"
  const cleanName = filename.replace(/\s*\([\d.]+\s*[KMG]B\)\s*$/i, '');
  const nameExt = cleanName.split('.').pop()?.toLowerCase();
  if (nameExt) return extToType(nameExt);

  return 'unknown';
}

function extToType(ext: string): FileType {
  if (ext === 'pdf') return 'pdf';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'docx') return 'docx';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'unknown';
}

export default function FileViewer({ url, filename, className }: FileViewerProps) {
  const fileType = detectFileType(url, filename);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [htmlSource, setHtmlSource] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
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

    if (fileType === 'html') {
      fetch(url)
        .then(res => res.text())
        .then(setHtmlSource)
        .catch(() => setHtmlSource(null));
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
        <div className={cn('flex flex-col gap-2 h-full', className)}>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant={showCode ? 'ghost' : 'secondary'}
              size="sm"
              onClick={() => setShowCode(false)}
              className="text-xs gap-1"
            >
              <Eye size={12} /> Render
            </Button>
            <Button
              variant={showCode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowCode(true)}
              className="text-xs gap-1"
            >
              <Code size={12} /> Source
            </Button>
          </div>
          {showCode ? (
            <pre className="text-xs bg-secondary rounded-lg border border-border p-4 overflow-auto font-mono whitespace-pre-wrap flex-1">
              {htmlSource || 'Loading...'}
            </pre>
          ) : htmlSource ? (
            <iframe
              srcDoc={htmlSource}
              className="w-full flex-1 rounded-lg border border-border bg-white"
              sandbox="allow-scripts allow-same-origin"
              title={filename}
            />
          ) : (
            <iframe
              src={url}
              className="w-full flex-1 rounded-lg border border-border bg-white"
              sandbox="allow-scripts allow-same-origin"
              title={filename}
            />
          )}
        </div>
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
