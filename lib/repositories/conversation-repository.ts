import { ConversationModel } from '@/lib/models/conversation';
import { logger } from '@/lib/utils/logger';

/**
 * In-memory conversation storage
 * In production, this should be replaced with a proper database (Redis, PostgreSQL, etc.)
 */
export class ConversationRepository {
  private conversations: Map<string, ConversationModel> = new Map();
  private readonly MAX_CONVERSATIONS = 1000; // Prevent memory overflow
  private readonly CONVERSATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async findById(id: string): Promise<ConversationModel | null> {
    const conversation = this.conversations.get(id);
    
    if (!conversation) {
      return null;
    }

    if (this.isExpired(conversation)) {
      this.conversations.delete(id);
      return null;
    }

    return conversation;
  }

  async save(conversation: ConversationModel): Promise<ConversationModel> {
    if (this.conversations.size >= this.MAX_CONVERSATIONS && !this.conversations.has(conversation.id)) {
      this.evictOldest();
    }

    this.conversations.set(conversation.id, conversation);
    
    logger.debug('Saved conversation', {
      id: conversation.id,
      messageCount: conversation.messages.length,
    });

    return conversation;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    
    if (deleted) {
      logger.debug('Deleted conversation', { id });
    }

    return deleted;
  }

  async findAll(): Promise<ConversationModel[]> {
    return Array.from(this.conversations.values());
  }

  async count(): Promise<number> {
    return this.conversations.size;
  }

  async cleanup(): Promise<number> {
    let cleaned = 0;

    for (const [id, conversation] of this.conversations.entries()) {
      if (this.isExpired(conversation)) {
        this.conversations.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up expired conversations', { count: cleaned });
    }

    return cleaned;
  }

  private isExpired(conversation: ConversationModel): boolean {
    const age = Date.now() - conversation.updatedAt.getTime();
    return age > this.CONVERSATION_TTL;
  }

  private evictOldest(): void {
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.updatedAt.getTime() < oldestTime) {
        oldestTime = conversation.updatedAt.getTime();
        oldestId = id;
      }
    }

    if (oldestId) {
      this.conversations.delete(oldestId);
      logger.debug('Evicted oldest conversation', { id: oldestId });
    }
  }

  async getStats() {
    const conversations = Array.from(this.conversations.values());
    
    return {
      total: conversations.length,
      totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
      averageMessages: conversations.length > 0
        ? conversations.reduce((sum, c) => sum + c.messages.length, 0) / conversations.length
        : 0,
      oldestConversation: conversations.length > 0
        ? Math.min(...conversations.map(c => c.createdAt.getTime()))
        : null,
    };
  }
}

let conversationRepository: ConversationRepository | null = null;

export function getConversationRepository(): ConversationRepository {
  if (!conversationRepository) {
    conversationRepository = new ConversationRepository();
    
    setInterval(() => {
      conversationRepository?.cleanup();
    }, 60 * 60 * 1000); 
  }
  
  return conversationRepository;
}