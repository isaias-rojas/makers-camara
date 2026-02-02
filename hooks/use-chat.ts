import { useCallback } from 'react';
import type { ChatRequest } from '@/types/chat.types';
import { MessageModel } from '@/lib/models/message';
import { useChatStore } from '@/store/chat-store';

export function useChat() {
  const {
    messages,
    conversationId,
    suggestedQuestions,
    isLoading,
    error,
    addMessage,
    setConversationId,
    setSuggestedQuestions,
    setIsLoading,
    setError,
    clearChat,
  } = useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      const userMessage = MessageModel.create('user', content);
      addMessage(userMessage.toJSON());

      try {
        const request: ChatRequest = {
          message: content,
          conversationId: conversationId || undefined,
        };

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to send message');
        }

        if (!response.body) {
           throw new Error('No response body');
        }

        const assistantMessageId = crypto.randomUUID(); 
        addMessage({
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; 

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              
              if (chunk.type === 'text') {
                 useChatStore.setState((state) => ({
                    messages: state.messages.map(msg => 
                        msg.id === assistantMessageId 
                        ? { ...msg, content: msg.content + chunk.content }
                        : msg
                    )
                 }));
              } else if (chunk.type === 'meta') {
                 if (chunk.conversationId) {
                     setConversationId(chunk.conversationId);
                 }
                 if (chunk.sources) {
                     useChatStore.setState((state) => ({
                        messages: state.messages.map(msg => 
                            msg.id === assistantMessageId 
                            ? { ...msg, sources: chunk.sources }
                            : msg
                        )
                     }));
                 }
              } else if (chunk.type === 'suggestions') {
                 setSuggestedQuestions(chunk.questions);
              }

            } catch (e) {
              console.error('Error parsing stream chunk', e);
            }
          }
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);

        const errorMsg = MessageModel.create(
          'assistant',
          `Lo siento, hubo un error: ${errorMessage}`
        );
        addMessage(errorMsg.toJSON());
      } finally {
        setIsLoading(false);
      }
    },
    [
      conversationId,
      isLoading,
      addMessage,
      setConversationId,
      setSuggestedQuestions,
      setIsLoading,
      setError,
    ]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  const handleClearChat = useCallback(async () => {
    if (conversationId) {
      try {
        await fetch(`/api/chat?conversationId=${conversationId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete conversation:', err);
      }
    }
    clearChat();
  }, [conversationId, clearChat]);

  return {
    messages,
    conversationId,
    suggestedQuestions,
    isLoading,
    error,
    sendMessage,
    handleSuggestedQuestion,
    clearChat: handleClearChat,
  };
}