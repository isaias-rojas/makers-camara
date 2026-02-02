import { Pinecone } from '@pinecone-database/pinecone';

export const VECTOR_CONFIG = {
  INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'camaral-knowledge-base',
  NAMESPACE: 'camaral-docs',
  TOP_K: 5, 
  MIN_SCORE: 0.5, 
  DIMENSION: 1536,
  METRIC: 'cosine' as const,
} as const;

export const METADATA_FIELDS = {
  TITLE: 'title',
  CATEGORY: 'category',
  SOURCE: 'source',
  LANGUAGE: 'language',
  LAST_UPDATED: 'lastUpdated',
} as const;

export const CATEGORIES = {
  COMPANY: 'company_info',
  PRODUCT: 'product_features',
  TECHNICAL: 'technical_docs',
  FAQ: 'faqs',
  USE_CASES: 'use_cases',
  PRICING: 'pricing',
  INTEGRATION: 'integration',
} as const;

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is not configured');
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }

  return pineconeClient;
}

export async function getVectorIndex() {
  const client = getPineconeClient();
  return client.index(VECTOR_CONFIG.INDEX_NAME);
}