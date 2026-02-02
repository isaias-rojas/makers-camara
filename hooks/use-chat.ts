import { useCallback } from 'react';
import type { ChatRequest, ChatResponse } from '@/types/chat.types';
import type { ApiResponse } from '@/types/api.types';
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

        const data: ApiResponse<ChatResponse> = await response.json();

        if (!data.success || !data.data) {
          throw new Error('Invalid response from server');
        }

        addMessage(data.data.message);

        if (data.data.conversationId && data.data.conversationId !== conversationId) {
          setConversationId(data.data.conversationId);
        }

        if (data.data.suggestedQuestions) {
          setSuggestedQuestions(data.data.suggestedQuestions);
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