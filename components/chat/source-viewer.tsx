'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useChatStore } from '@/store/chat-store';
import ReactMarkdown from 'react-markdown';

export function SourceViewer() {
  const { selectedSource, isSourceViewerOpen, closeSourceViewer } = useChatStore();

  if (!selectedSource) return null;

  return (
    <Sheet open={isSourceViewerOpen} onOpenChange={(open) => !open && closeSourceViewer()}>
      <SheetContent className="w-100 sm:w-135 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl leading-tight">{selectedSource.title}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
              Relevancia: {Math.round((selectedSource.score || 0) * 100)}%
            </span>
            {selectedSource.metadata?.category && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                {selectedSource.metadata.category.replace('_', ' ')}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Contenido Recuperado
            </h4>
            <div className="p-4 bg-muted/50 rounded-lg border border-border text-sm leading-relaxed">
              <ReactMarkdown>{selectedSource.excerpt}</ReactMarkdown>
            </div>
          </div>

          {selectedSource.metadata && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Metadatos
              </h4>
              <dl className="grid grid-cols-1 gap-3 text-sm">
                {Object.entries(selectedSource.metadata).map(([key, value]) => {
                  if (key === 'content' || key === 'title' || typeof value === 'object') return null;
                  return (
                    <div key={key} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                      <dt className="text-muted-foreground capitalize font-medium">{key}</dt>
                      <dd className="text-foreground text-right">{String(value)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}