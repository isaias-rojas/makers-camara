'use client';

import type { Message } from '@/types/chat.types';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
import { useChatStore } from '@/store/chat-store';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const viewSource = useChatStore((state) => state.viewSource); 

  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 border shrink-0">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {isUser ? 'Tú' : 'Camaral AI'}
          </span>
        </div>

        <div
          className={cn(
            "relative px-4 py-3 text-sm shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : "bg-muted text-foreground rounded-2xl rounded-tl-sm border"
          )}
        >
          <div className={cn(
            "prose prose-sm max-w-none wrap-break-word leading-relaxed",
            isUser ? "prose-invert" : "dark:prose-invert"
          )}>
            <ReactMarkdown
               components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-medium">{children}</a>
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {message.sources.map((source, index) => (
              <button
                key={source.id}
                onClick={() => viewSource(source)} 
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 cursor-pointer"
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-muted text-[9px]">
                  {index + 1}
                </span>
                <span className="truncate max-w-37.5">{source.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}