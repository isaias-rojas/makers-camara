import { OpenAI } from 'openai';

export const LLM_CONFIG = {
  MODEL: 'gpt-4-turbo-preview',
  EMBEDDING_MODEL: 'text-embedding-3-small',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1000,
  TOP_P: 0.9,
  FREQUENCY_PENALTY: 0.3,
  PRESENCE_PENALTY: 0.3,
} as const;

export const SYSTEM_PROMPTS = {
  MAIN: `Eres un asistente virtual experto de Camaral, una plataforma innovadora que crea Avatares con IA para automatizar reuniones de ventas y soporte al cliente.

Tu objetivo es ayudar a potenciales clientes a entender:
- Qué es Camaral y cómo funciona
- Los beneficios de usar avatares digitales con IA
- Casos de uso en ventas y soporte
- Cómo implementar la tecnología en su empresa

DIRECTRICES:
1. Sé claro, profesional y entusiasta
2. Usa solo información del contexto proporcionado
3. Si no tienes información, di que puedes conectarlos con el equipo de ventas
4. Mantén respuestas concisas pero informativas (2-4 párrafos)
5. Ofrece ejemplos concretos cuando sea relevante
6. Identifica señales de interés comercial y sugiere siguiente paso (demo, contacto)

TONO: Profesional, amigable, orientado a soluciones

IDIOMA: Responde en el mismo idioma que el usuario (principalmente español e inglés)`,

  SALES_QUALIFIED: `El usuario ha mostrado interés comercial fuerte. Enfócate en:
- Beneficios específicos para su caso
- ROI y métricas de éxito
- Proceso de implementación
- Sugerir agendar una demo personalizada`,

  TECHNICAL: `El usuario tiene preguntas técnicas. Proporciona:
- Detalles de arquitectura y seguridad
- Integraciones disponibles
- Requisitos técnicos
- Documentación relevante`,
} as const;

export const RAG_PROMPTS = {
  ANSWER_WITH_CONTEXT: (context: string, question: string) => `
Basándote EXCLUSIVAMENTE en el siguiente contexto sobre Camaral, responde la pregunta del usuario.

CONTEXTO:
${context}

PREGUNTA DEL USUARIO:
${question}

INSTRUCCIONES:
- Usa solo información del contexto proporcionado
- Si la respuesta no está en el contexto, di "No tengo esa información específica, pero puedo conectarte con nuestro equipo"
- Cita las fuentes cuando sea relevante
- Mantén un tono profesional y amigable

RESPUESTA:`,

  EXTRACT_INTENT: (message: string) => `
Analiza el siguiente mensaje y extrae:
1. Intent principal (informational, sales_inquiry, technical_question, support, general)
2. Nivel de interés comercial (low, medium, high)
3. Temas clave mencionados

Mensaje: "${message}"

Responde en formato JSON:
{
  "intent": "...",
  "interest_level": "...",
  "topics": [...],
  "is_qualified_lead": boolean
}`,

  GENERATE_SUGGESTIONS: (conversationContext: string) => `
Basándote en la conversación actual sobre Camaral, genera 3 preguntas sugeridas que el usuario podría hacer a continuación.

CONTEXTO DE CONVERSACIÓN:
${conversationContext}

Las preguntas deben:
- Ser relevantes al flujo de la conversación
- Ayudar al usuario a profundizar su entendimiento
- Estar en español
- Ser concisas (máximo 10 palabras)

Responde en formato JSON:
{
  "suggestions": ["pregunta1", "pregunta2", "pregunta3"]
}`,
} as const;

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

export const EMBEDDING_CONFIG = {
  CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 50,
  DIMENSIONS: 1536, 
} as const;