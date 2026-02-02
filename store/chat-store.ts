import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message, DocumentSource } from '@/types/chat.types';

interface ChatState {
  messages: Message[];
  conversationId: string | null;
  suggestedQuestions: string[];
  isLoading: boolean;
  error: string | null;
  selectedSource: DocumentSource | null;
  isSourceViewerOpen: boolean;
  
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setConversationId: (id: string) => void;
  setSuggestedQuestions: (questions: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  reset: () => void;
  viewSource: (source: DocumentSource) => void;
  closeSourceViewer: () => void;
}

const initialState = {
  messages: [],
  conversationId: null,
  suggestedQuestions: [
    '¿Qué es Camaral?',
    '¿Cómo funcionan los avatares?',
    '¿Cuánto cuesta?',
  ],
  isLoading: false,
  error: null,
  selectedSource: null,
  isSourceViewerOpen: false,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      setMessages: (messages) =>
        set({ messages }),

      setConversationId: (id) =>
        set({ conversationId: id }),

      setSuggestedQuestions: (questions) =>
        set({ suggestedQuestions: questions }),

      setIsLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      clearChat: () =>
        set({
          messages: [],
          conversationId: null,
          suggestedQuestions: initialState.suggestedQuestions,
          error: null,
          selectedSource: null,
          isSourceViewerOpen: false,
        }),

      reset: () =>
        set(initialState),

      viewSource: (source) => 
        set({ selectedSource: source, isSourceViewerOpen: true }),

      closeSourceViewer: () => 
        set({ isSourceViewerOpen: false }),
    }),
    {
      name: 'camaral-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        messages: state.messages, 
        conversationId: state.conversationId,
        suggestedQuestions: state.suggestedQuestions,
      }) as unknown as ChatState,
      onRehydrateStorage: () => {
        return (storedState) => {
          if (storedState) {
             if (!storedState.suggestedQuestions || storedState.suggestedQuestions.length === 0) {
               storedState.suggestedQuestions = initialState.suggestedQuestions;
             }
          }
        };
      },
    }
  )
);
