'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface AiMarkdownProps {
  content: string;
  className?: string;
}

export function AiMarkdown({ content, className }: AiMarkdownProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none text-foreground break-words text-sm', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-3 mb-1.5 tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-foreground mt-2.5 mb-1 tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-semibold text-foreground mt-2 mb-1">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-4 space-y-1 my-2 text-sm">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-4 space-y-1 my-2 text-sm">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/70 bg-muted/40 pl-3 py-1 my-2 italic text-muted-foreground rounded-r-md text-xs sm:text-sm">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2.5 w-full max-w-full overflow-x-auto rounded-xl border border-border/80 bg-background/60 shadow-xs">
              <table className="w-full text-xs text-left border-collapse min-w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/90 text-foreground font-semibold border-b border-border/80">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border/40">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-foreground/90 whitespace-nowrap">{children}</td>,
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="rounded-md bg-background/90 px-1.5 py-0.5 font-mono text-xs text-primary font-medium border border-border/50" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-2 overflow-x-auto rounded-xl bg-background/90 p-3 font-mono text-xs text-foreground border border-border/70">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          hr: () => <hr className="my-3 border-border/60" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
