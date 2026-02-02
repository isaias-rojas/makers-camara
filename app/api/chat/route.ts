import { NextRequest, NextResponse } from 'next/server';
import { validateChatRequest, sanitizeInput } from '@/lib/utils/validators';
import { handleError, isAppError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse } from '@/types/api.types';
import { getChatService } from '@/lib/services/chat-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await request.json();

    const validatedData = validateChatRequest(body);

    const sanitizedMessage = sanitizeInput(validatedData.message);

    const chatService = getChatService();
    
    
    const { stream } = await chatService.processMessageStream({
      message: sanitizedMessage,
      conversationId: validatedData.conversationId,
      context: validatedData.context,
    });

    const encoder = new TextEncoder();
    
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
          }
          controller.close();
        } catch (err) {
          logger.error('Stream processing error', err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    logger.error('Chat API error', error, { requestId });

    const appError = handleError(error);
    const apiResponse: ApiResponse = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: isAppError(error) ? appError.details : undefined,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(apiResponse, { 
      status: isAppError(error) ? appError.statusCode : 500 
    });
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'conversationId is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const chatService = getChatService();
    const conversation = await chatService.getConversation(conversationId);

    const apiResponse: ApiResponse = {
      success: true,
      data: conversation.toJSON(),
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    logger.error('Get conversation error', error, { requestId });

    const appError = handleError(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: appError.code,
          message: appError.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: isAppError(error) ? appError.statusCode : 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'conversationId is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const chatService = getChatService();
    await chatService.deleteConversation(conversationId);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    logger.error('Delete conversation error', error, { requestId });

    const appError = handleError(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: appError.code,
          message: appError.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: isAppError(error) ? appError.statusCode : 500 }
    );
  }
}