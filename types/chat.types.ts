export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  metadata?: MessageMetadata;
}

export interface DocumentSource {
  id: string;
  title: string;
  excerpt: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface MessageMetadata {
  confidence?: number;
  processingTime?: number;
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  [key: string]: any; 
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  userId?: string;
  sessionId?: string;
  tags?: string[];
  leadScore?: number;
  [key: string]: any;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
  suggestedQuestions?: string[];
}

export interface RAGContext {
  documents: RetrievedDocument[];
  query: string;
  totalDocuments: number;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  score: number;
}

export interface DocumentMetadata {
  title: string;
  category: string;
  source: string;
  lastUpdated?: string;
  language?: string;
}

export interface StreamChunk {
  type: 'token' | 'source' | 'complete' | 'error';
  content: string;
  sources?: DocumentSource[];
  error?: string;
}