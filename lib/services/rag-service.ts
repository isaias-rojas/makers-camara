import { getVectorRepository } from '@/lib/repositories/vector-repository';
import { getOpenAIClient, LLM_CONFIG, RAG_PROMPTS, SYSTEM_PROMPTS } from '@/lib/config/llm.config';
import type { RetrievedDocument, RAGContext } from '@/types/chat.types';
import { logger } from '@/lib/utils/logger';
import { ExternalServiceError } from '@/lib/utils/errors';

export interface RAGResponse {
  answer: string;
  sources: RetrievedDocument[];
  confidence: number;
  processingTime: number;
}

export class RAGService {
  private vectorRepo = getVectorRepository();
  private openai = getOpenAIClient();

  async query(
    userQuery: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      logger.info('Starting RAG query', { 
        query: userQuery.substring(0, 50) 
      });

      const documents = await this.retrieveDocuments(userQuery);

      if (documents.length === 0) {
        logger.warn('No relevant documents found', { query: userQuery });
        return this.generateFallbackResponse(userQuery, startTime);
      }

      const context = this.buildContext(documents);

      const answer = await this.generateAnswer(userQuery, context, conversationHistory);

      const confidence = this.calculateConfidence(documents);

      const processingTime = Date.now() - startTime;

      logger.info('RAG query completed', {
        processingTime,
        documentsUsed: documents.length,
        confidence,
      });

      return {
        answer,
        sources: documents,
        confidence,
        processingTime,
      };
    } catch (error) {
      logger.error('RAG query failed', error);
      throw new ExternalServiceError('RAG', 'Failed to process query');
    }
  }

  private async retrieveDocuments(query: string): Promise<RetrievedDocument[]> {
    const enhancedQuery = this.enhanceQuery(query);
    
    const documents = await this.vectorRepo.searchSimilar(enhancedQuery, 5);

    return this.rerankDocuments(query, documents);
  }

  private enhanceQuery(query: string): string {
    const keywords = ['Camaral', 'avatares', 'AI', 'ventas', 'soporte'];
    const hasKeyword = keywords.some(kw => 
      query.toLowerCase().includes(kw.toLowerCase())
    );

    if (!hasKeyword) {
      return `${query} Camaral avatares digitales`;
    }

    return query;
  }

  private rerankDocuments(
    query: string,
    documents: RetrievedDocument[]
  ): RetrievedDocument[] {
    return documents
      .map(doc => {
        const adjustedScore = this.calculateRelevanceScore(query, doc);
        logger.info('Reranking doc', {
          id: doc.id,
          originalScore: doc.score,
          adjustedScore,
          title: doc.metadata.title
        });
        return {
          ...doc,
          adjustedScore,
        };
      })
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .map(({ adjustedScore, ...doc }) => doc)
      .slice(0, 3); 
  }

  private calculateRelevanceScore(query: string, doc: RetrievedDocument): number {
    let score = doc.score;

    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = doc.content.toLowerCase();
    
    let matchCount = 0;
    for (const term of queryTerms) {
      if (term.length > 3 && contentLower.includes(term)) {
         matchCount++;
      }
    }

    if (queryTerms.length > 0) {
       score += (matchCount / queryTerms.length) * 0.2; 
    }

    if (doc.metadata.lastUpdated) {
      const daysSinceUpdate = 
        (Date.now() - new Date(doc.metadata.lastUpdated).getTime()) / 
        (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 30) {
        score += 0.05;
      }
    }

    return score; 
  }

  private buildContext(documents: RetrievedDocument[]): string {
    return documents
      .map((doc, index) => {
        return `
[Fuente ${index + 1}: ${doc.metadata.title}]
${doc.content}
`;
      })
      .join('\n---\n');
  }

  private async generateAnswer(
    query: string,
    context: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.MAIN,
        },
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-4); 
        messages.push(
          ...recentHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
        );
      }

      messages.push({
        role: 'user',
        content: RAG_PROMPTS.ANSWER_WITH_CONTEXT(context, query),
      });

      const response = await this.openai.chat.completions.create({
        model: LLM_CONFIG.MODEL,
        messages,
        temperature: LLM_CONFIG.TEMPERATURE,
        max_tokens: LLM_CONFIG.MAX_TOKENS,
        top_p: LLM_CONFIG.TOP_P,
        frequency_penalty: LLM_CONFIG.FREQUENCY_PENALTY,
        presence_penalty: LLM_CONFIG.PRESENCE_PENALTY,
      });

      return response.choices[0]?.message?.content || 'No pude generar una respuesta.';
    } catch (error) {
      logger.error('Failed to generate answer', error);
      throw new ExternalServiceError('OpenAI', 'Failed to generate answer');
    }
  }

  private calculateConfidence(documents: RetrievedDocument[]): number {
    if (documents.length === 0) return 0;

    const avgScore = documents.reduce((sum, doc) => sum + doc.score, 0) / documents.length;
    const topScore = documents[0]?.score || 0;

    return (topScore * 0.7 + avgScore * 0.3);
  }

  private async generateFallbackResponse(
    query: string,
    startTime: number
  ): Promise<RAGResponse> {
    const fallbackAnswer = `
No encontré información específica sobre "${query}" en nuestra base de conocimiento.

Sin embargo, puedo ayudarte con:
- Información general sobre Camaral y nuestros avatares con IA
- Casos de uso en ventas y soporte
- Proceso de implementación
- Agendar una demo personalizada

¿Te gustaría que te conecte con nuestro equipo para una consulta más específica?
    `.trim();

    return {
      answer: fallbackAnswer,
      sources: [],
      confidence: 0.3,
      processingTime: Date.now() - startTime,
    };
  }

  async extractIntent(query: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: LLM_CONFIG.MODEL,
        messages: [
          {
            role: 'user',
            content: RAG_PROMPTS.EXTRACT_INTENT(query),
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to extract intent', error);
      return {
        intent: 'general',
        interest_level: 'low',
        topics: [],
        is_qualified_lead: false,
      };
    }
  }

  async generateSuggestions(conversationContext: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: LLM_CONFIG.MODEL,
        messages: [
          {
            role: 'user',
            content: RAG_PROMPTS.GENERATE_SUGGESTIONS(conversationContext),
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      return parsed.suggestions || [];
    } catch (error) {
      logger.error('Failed to generate suggestions', error);
      return [
        '¿Cómo funcionan los avatares de Camaral?',
        '¿Cuáles son los beneficios en ventas?',
        '¿Cómo puedo solicitar una demo?',
      ];
    }
  }
}

let ragService: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragService) {
    ragService = new RAGService();
  }
  return ragService;
}