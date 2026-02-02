import { getRAGService } from './rag-service';
import { getConversationRepository } from '@/lib/repositories/conversation-repository';
import { ConversationModel } from '@/lib/models/conversation';
import { MessageModel } from '@/lib/models/message';
import type { ChatRequest, ChatResponse } from '@/types/chat.types';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/utils/errors';

export class ChatService {
  private ragService = getRAGService();
  private conversationRepo = getConversationRepository();

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      logger.info('Processing chat message', {
        conversationId: request.conversationId,
        messageLength: request.message.length,
      });

      const conversation = await this.getOrCreateConversation(request.conversationId);

      const userMessage = MessageModel.create('user', request.message);
      conversation.addMessage(userMessage.toJSON());

      const history = this.getConversationHistory(conversation);

      const ragResponse = await this.ragService.query(request.message, history);

      const assistantMessage = MessageModel.create('assistant', ragResponse.answer);
      
      if (ragResponse.sources.length > 0) {
        assistantMessage.sources = ragResponse.sources.map(doc => ({
          id: doc.id,
          title: doc.metadata.title,
          excerpt: doc.content.substring(0, 200) + '...',
          score: doc.score,
          metadata: doc.metadata,
        }));
      }

      assistantMessage.setMetadata('confidence', ragResponse.confidence);
      assistantMessage.setMetadata('processingTime', ragResponse.processingTime);

      const intent = await this.ragService.extractIntent(request.message);
      assistantMessage.setMetadata('intent', intent);

      if (intent.is_qualified_lead) {
        conversation.setMetadata('leadScore', (conversation.metadata?.leadScore || 0) + 1);
      }

      conversation.addMessage(assistantMessage.toJSON());

      await this.conversationRepo.save(conversation);

      const suggestedQuestions = await this.generateSuggestedQuestions(conversation);

      const totalTime = Date.now() - startTime;

      logger.info('Chat message processed', {
        conversationId: conversation.id,
        totalTime,
        confidence: ragResponse.confidence,
      });

      return {
        message: assistantMessage.toJSON(),
        conversationId: conversation.id,
        suggestedQuestions,
      };
    } catch (error) {
      logger.error('Failed to process chat message', error);
      throw error;
    }
  }

  private async getOrCreateConversation(
    conversationId?: string
  ): Promise<ConversationModel> {
    if (conversationId) {
      const conversation = await this.conversationRepo.findById(conversationId);
      if (conversation) {
        return conversation;
      }
      logger.warn('Conversation not found, creating new one', { conversationId });
    }

    return ConversationModel.create();
  }

  private getConversationHistory(
    conversation: ConversationModel
  ): Array<{ role: string; content: string }> {
    return conversation
      .getContext(6) 
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  private async generateSuggestedQuestions(
    conversation: ConversationModel
  ): Promise<string[]> {
    try {
      const recentMessages = conversation.getContext(4);
      const context = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      return await this.ragService.generateSuggestions(context);
    } catch (error) {
      logger.error('Failed to generate suggestions', error);
      return [
        '¿Cómo funcionan los avatares de Camaral?',
        '¿Qué beneficios aporta en ventas?',
        '¿Puedo solicitar una demo?',
      ];
    }
  }

  async getConversation(conversationId: string): Promise<ConversationModel> {
    const conversation = await this.conversationRepo.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }

    return conversation;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const deleted = await this.conversationRepo.delete(conversationId);
    
    if (!deleted) {
      throw new NotFoundError('Conversation', conversationId);
    }
  }

  async getAllConversations(): Promise<ConversationModel[]> {
    return await this.conversationRepo.findAll();
  }

  async getStats() {
    return await this.conversationRepo.getStats();
  }
}

let chatService: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatService) {
    chatService = new ChatService();
  }
  return chatService;
}