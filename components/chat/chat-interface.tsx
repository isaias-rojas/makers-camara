'use client';

import { useEffect, useRef } from 'react';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage } from '@/components/chat/chat-message';
import { SuggestedQuestions } from '@/components/chat/suggested-questions';
import { ChatHeader } from '@/components/chat/chat-header';
import { useChat } from '@/hooks/use-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ChatInterface() {
  const {
    messages,
    suggestedQuestions,
    isLoading,
    error,
    sendMessage,
    handleSuggestedQuestion,
    clearChat,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onNewChat={clearChat} showNewChatButton={!showWelcome} />
      <main className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollAreaRef}
          className="h-full overflow-y-auto scroll-smooth px-4 md:px-0"
        >
          <div className="max-w-2xl mx-auto py-10 min-h-full flex flex-col">
            
            {showWelcome ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src="/placeholder-avatar.png" alt="Camaral AI" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">CA</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Camaral AI
                    </h1>
                    <p className="text-muted-foreground max-w-125">
                      Estoy aquí para ayudarte con información sobre nuestros avatares y servicios. ¿Por dónde empezamos?
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-lg grid gap-2">
                  {['¿Qué es Camaral?', 'Precios y planes', 'Casos de éxito', 'Agendar demo'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="inline-flex items-center justify-between whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                    >
                      {q}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                   <div className="flex gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg rounded-tl-none px-4 py-3 flex items-center gap-1.5 h-10">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-0" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-300" />
                    </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4 md:px-0 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {!showWelcome && suggestedQuestions.length > 0 && (
             <SuggestedQuestions 
               questions={suggestedQuestions} 
               onSelect={handleSuggestedQuestion} 
               disabled={isLoading} 
             />
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
               {error}
            </div>
          )}

          <ChatInput onSend={sendMessage} isLoading={isLoading} />
          
          <p className="text-center text-[10px] text-muted-foreground">
            Camaral AI puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </footer>
    </div>
  );
}