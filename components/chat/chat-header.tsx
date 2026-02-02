'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatHeaderProps {
  onNewChat: () => void;
  showNewChatButton: boolean;
}

export function ChatHeader({ onNewChat, showNewChatButton }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-2xl mx-auto flex h-14 items-center justify-between px-4 md:px-0">
        <div className="flex items-center gap-2 font-semibold">
          <Avatar className="h-6 w-6 rounded-md">
            <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
          </Avatar>
          <span>Camaral AI</span>
        </div>
        
        {showNewChatButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNewChat}
            className="text-muted-foreground h-8 text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nuevo Chat
          </Button>
        )}
      </div>
    </header>
  );
}