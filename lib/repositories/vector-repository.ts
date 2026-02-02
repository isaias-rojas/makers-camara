import { getVectorIndex, VECTOR_CONFIG, METADATA_FIELDS } from '@/lib/config/vector.config';
import { getOpenAIClient, EMBEDDING_CONFIG } from '@/lib/config/llm.config';
import type { RetrievedDocument } from '@/types/chat.types';
import { logger } from '@/lib/utils/logger';
import { ExternalServiceError } from '@/lib/utils/errors';

export interface VectorDocument {
  id: string;
  values: number[];
  metadata: {
    content: string;
    title: string;
    category: string;
    source: string;
    language?: string;
    lastUpdated?: string;
  };
}

export class VectorRepository {
  private async embedText(text: string): Promise<number[]> {
    try {
      const openai = getOpenAIClient();
      const response = await openai.embeddings.create({
        model: EMBEDDING_CONFIG.DIMENSIONS === 1536 
          ? 'text-embedding-3-small' 
          : 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', error);
      throw new ExternalServiceError('OpenAI', 'Failed to generate embedding');
    }
  }

  async upsertDocuments(documents: VectorDocument[]): Promise<void> {
    try {
      const index = await getVectorIndex();
      const namespace = index.namespace(VECTOR_CONFIG.NAMESPACE);

      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await namespace.upsert({ records: batch });
        logger.info(`Upserted batch ${i / batchSize + 1}`, { 
          count: batch.length 
        });
      }

      logger.info('Successfully upserted documents', { 
        total: documents.length 
      });
    } catch (error) {
      logger.error('Failed to upsert documents', error);
      throw new ExternalServiceError('Pinecone', 'Failed to upsert documents');
    }
  }

  async searchSimilar(
    query: string,
    topK: number = VECTOR_CONFIG.TOP_K,
    filter?: Record<string, any>
  ): Promise<RetrievedDocument[]> {
    try {
      logger.time('vector-search');
      
      const queryEmbedding = await this.embedText(query);

      const index = await getVectorIndex();
      const namespace = index.namespace(VECTOR_CONFIG.NAMESPACE);

      const searchResults = await namespace.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter,
      });

      logger.timeEnd('vector-search');

      const documents: RetrievedDocument[] = searchResults.matches
        .filter(match => match.score && match.score >= VECTOR_CONFIG.MIN_SCORE)
        .map(match => ({
          id: match.id,
          content: (match.metadata?.content as string) || '',
          score: match.score || 0,
          metadata: {
            title: (match.metadata?.title as string) || '',
            category: (match.metadata?.category as string) || '',
            source: (match.metadata?.source as string) || '',
            language: match.metadata?.language as string,
            lastUpdated: match.metadata?.lastUpdated as string,
          },
        }));

      logger.info('Vector search completed', {
        query: query.substring(0, 50),
        resultsCount: documents.length,
        topScore: documents[0]?.score,
      });

      return documents;
    } catch (error) {
      logger.error('Failed to search vectors', error);
      throw new ExternalServiceError('Pinecone', 'Failed to search documents');
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      const index = await getVectorIndex();
      const namespace = index.namespace(VECTOR_CONFIG.NAMESPACE);

      await namespace.deleteMany(ids);
      
      logger.info('Deleted documents', { count: ids.length });
    } catch (error) {
      logger.error('Failed to delete documents', error);
      throw new ExternalServiceError('Pinecone', 'Failed to delete documents');
    }
  }

  async deleteAll(): Promise<void> {
    try {
      const index = await getVectorIndex();
      const namespace = index.namespace(VECTOR_CONFIG.NAMESPACE);

      await namespace.deleteAll();
      
      logger.info('Deleted all documents from namespace');
    } catch (error) {
      logger.error('Failed to delete all documents', error);
      throw new ExternalServiceError('Pinecone', 'Failed to delete all documents');
    }
  }

  async getStats(): Promise<any> {
    try {
      const index = await getVectorIndex();
      const stats = await index.describeIndexStats();
      
      return stats;
    } catch (error) {
      logger.error('Failed to get index stats', error);
      throw new ExternalServiceError('Pinecone', 'Failed to get stats');
    }
  }
}

let vectorRepository: VectorRepository | null = null;

export function getVectorRepository(): VectorRepository {
  if (!vectorRepository) {
    vectorRepository = new VectorRepository();
  }
  return vectorRepository;
}