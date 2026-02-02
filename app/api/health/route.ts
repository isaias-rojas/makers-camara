import { NextResponse } from 'next/server';
import type { HealthCheckResponse } from '@/types/api.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    const openaiStatus = process.env.OPENAI_API_KEY ? 'up' : 'down';

    const pineconeStatus = process.env.PINECONE_API_KEY ? 'up' : 'down';

    const allUp = openaiStatus === 'up' && pineconeStatus === 'up';
    const status = allUp ? 'healthy' : 'degraded';

    const response: HealthCheckResponse = {
      status,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'up',
          latency: 0,
        },
        llm: {
          status: openaiStatus,
          latency: Date.now() - startTime,
          message: openaiStatus === 'down' ? 'OpenAI API key not configured' : undefined,
        },
        vectorDb: {
          status: pineconeStatus,
          latency: Date.now() - startTime,
          message: pineconeStatus === 'down' ? 'Pinecone API key not configured' : undefined,
        },
      },
    };

    return NextResponse.json(response, {
      status: status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}