import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Message, ConversationMetadata } from '@/types/chat.types';
import { MessageModel } from './message';

export class ConversationModel implements Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;

  constructor(data?: Partial<Conversation>) {
    this.id = data?.id || uuidv4();
    this.messages = data?.messages || [];
    this.createdAt = data?.createdAt || new Date();
    this.updatedAt = data?.updatedAt || new Date();
    this.metadata = data?.metadata;
  }

  static create(): ConversationModel {
    return new ConversationModel();
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.updatedAt = new Date();
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  getMessagesByRole(role: Message['role']): Message[] {
    return this.messages.filter((m) => m.role === role);
  }

  getContext(maxMessages: number = 10): Message[] {
    return this.messages.slice(-maxMessages);
  }

  clearMessages(): void {
    this.messages = [];
    this.updatedAt = new Date();
  }

  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {} as ConversationMetadata;
    }
    (this.metadata as Record<string, any>)[key] = value;
    this.updatedAt = new Date();
  }

  toJSON(): Conversation {
    return {
      id: this.id,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }

  static fromJSON(json: any): ConversationModel {
    return new ConversationModel({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      messages: json.messages.map((m: any) => MessageModel.fromJSON(m)),
    });
  }
}