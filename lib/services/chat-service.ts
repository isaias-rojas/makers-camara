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

  async processMessageStream(request: ChatRequest): Promise<{ 
    stream: AsyncIterable<any>; 
    conversationId: string; 
    sources: any[];
    suggestedQuestions: string[];
  }> {
    const startTime = Date.now();
    logger.info('Processing chat stream', { conversationId: request.conversationId });

    const conversation = await this.getOrCreateConversation(request.conversationId);
    
    const userMessage = MessageModel.create('user', request.message);
    conversation.addMessage(userMessage.toJSON());
    await this.conversationRepo.save(conversation); 

    const history = this.getConversationHistory(conversation);

    const { stream, sources, confidence, processingTime } = await this.ragService.queryStream(request.message, history);

 
    const suggestedQuestionsPromise = this.generateSuggestedQuestions(conversation);

    const conversationRepo = this.conversationRepo;
    const self = this;
    
    async function* wrappedStream() {
      let fullContent = '';
      
      yield { type: 'meta', sources: sources.map(doc => ({
          id: doc.id,
          title: doc.metadata.title,
          excerpt: doc.content.substring(0, 200) + '...',
          score: doc.score,
        })),
        conversationId: conversation.id
      };

      for await (const chunk of stream) {
        const content = typeof chunk === 'string' ? chunk : (chunk.choices?.[0]?.delta?.content || '');
        if (content) {
          fullContent += content;
          yield { type: 'text', content };
        }
      }

      const assistantMessage = MessageModel.create('assistant', fullContent);
      if (sources.length > 0) {
        assistantMessage.sources = sources.map(doc => ({
          id: doc.id,
          title: doc.metadata.title,
          excerpt: doc.content.substring(0, 200) + '...',
          score: doc.score,
          metadata: doc.metadata,
        }));
      }
      assistantMessage.setMetadata('confidence', confidence);
      assistantMessage.setMetadata('processingTime', processingTime);
      
      conversation.addMessage(assistantMessage.toJSON());
      await conversationRepo.save(conversation);
      
      const suggestions = await suggestedQuestionsPromise;
      yield { type: 'suggestions', questions: suggestions };
    }

    return {
      stream: wrappedStream(),
      conversationId: conversation.id,
      sources: [], 
      suggestedQuestions: [], 
    };
  }

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