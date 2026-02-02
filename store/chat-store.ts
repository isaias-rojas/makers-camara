import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Message } from '@/types/chat.types';


interface ChatState {
  messages: Message[];
  conversationId: string | null;
  suggestedQuestions: string[];
  isLoading: boolean;
  error: string | null;

  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setConversationId: (id: string | null) => void;
  setSuggestedQuestions: (questions: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  reset: () => void;
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
};


const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const storage =
  typeof window !== 'undefined'
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => noopStorage);


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
        }),

      reset: () =>
        set({ ...initialState }),
    }),
    {
      name: 'camaral-chat-storage',
      storage,

      partialize: (state) => ({
        messages: state.messages,
        conversationId: state.conversationId,
      }),
    }
  )
);
