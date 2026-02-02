import { z, ZodError } from 'zod';
import { ValidationError } from './errors';

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
  context: z.record(z.string(), z.any()).optional(), 
});

export const IngestDocumentSchema = z.object({
  content: z.string().min(10),
  metadata: z.object({
    title: z.string(),
    category: z.string(),
    source: z.string(),
    language: z.string().optional(),
  }),
});

export function validateChatRequest(data: unknown) {
  try {
    return ChatRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid chat request', {
        errors: error.issues, 
      });
    }
    throw error;
  }
}

export function validateIngestDocument(data: unknown) {
  try {
    return IngestDocumentSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid document', {
        errors: error.issues, 
      });
    }
    throw error;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') 
    .substring(0, 2000); 
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}