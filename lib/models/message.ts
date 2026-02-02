import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { Message, MessageRole, DocumentSource, MessageMetadata } from '@/types/chat.types';

export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
  timestamp: z.date(),
  sources: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(), 
});

export class MessageModel implements Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  metadata?: MessageMetadata;

  constructor(data: Partial<Message>) {
    this.id = data.id || uuidv4();
    this.role = data.role || 'user';
    this.content = data.content || '';
    this.timestamp = data.timestamp || new Date();
    this.sources = data.sources;
    this.metadata = data.metadata;
  }

  static create(role: MessageRole, content: string): MessageModel {
    return new MessageModel({ role, content });
  }

  static fromJSON(json: any): MessageModel {
    return new MessageModel({
      ...json,
      timestamp: new Date(json.timestamp),
    });
  }

  toJSON(): Message {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      sources: this.sources,
      metadata: this.metadata,
    };
  }

  validate(): boolean {
    try {
      MessageSchema.parse(this.toJSON());
      return true;
    } catch {
      return false;
    }
  }

  addSource(source: DocumentSource): void {
    if (!this.sources) {
      this.sources = [];
    }
    this.sources.push(source);
  }

  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {} as MessageMetadata;
    }
    (this.metadata as Record<string, any>)[key] = value;
  }
}