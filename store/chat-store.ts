import { create } from 'zustand';
import type { Message, ChatResponse } from '@/types/chat.types';

interface ChatState {
  messages: Message[];
  conversationId: string | null;
  suggestedQuestions: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setConversationId: (id: string) => void;
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

export const useChatStore = create<ChatState>((set) => ({
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
    set(initialState),
}));