import 'dotenv/config'; // Add this line at the top!

import { getVectorRepository } from '@/lib/repositories/vector-repository';
import { getOpenAIClient } from '../lib/config/llm.config';
import { CATEGORIES } from '../lib/config/vector.config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Chunk text into smaller pieces
async function chunkText(text: string, chunkSize: number = 500): Promise<string[]> {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const potentialChunk = currentChunk + '\n\n' + paragraph;
    
    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk = potentialChunk;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Generate embedding for text
async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// Ingest a single document
async function ingestDocument(
  filePath: string,
  category: string,
  title: string
) {
  console.log(`\n📄 Ingesting: ${title}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const chunks = await chunkText(content);

  console.log(`   Split into ${chunks.length} chunks`);

  const vectorRepo = getVectorRepository();
  const documents = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const embedding = await embedText(chunk);

      documents.push({
        id: `${path.basename(filePath, '.md')}-${i}-${uuidv4().substring(0, 8)}`,
        values: embedding,
        metadata: {
          content: chunk,
          title: `${title} (Parte ${i + 1}/${chunks.length})`,
          category,
          source: path.basename(filePath),
          language: 'es',
          lastUpdated: new Date().toISOString(),
        },
      });

      process.stdout.write(`\r   Processing: ${i + 1}/${chunks.length} chunks`);
    } catch (error) {
      console.error(`\n   ❌ Error processing chunk ${i + 1}:`, error);
    }
  }

  console.log('\n   Uploading to Pinecone...');
  await vectorRepo.upsertDocuments(documents);
  console.log(`   ✅ Completed: ${title}`);
}

// Main ingestion function
async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🚀 Camaral Knowledge Base Ingestion     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const knowledgeBasePath = path.join(process.cwd(), 'public', 'knowledge-base');

  // Check if directory exists
  if (!fs.existsSync(knowledgeBasePath)) {
    console.error('❌ Knowledge base directory not found!');
    console.error(`   Expected: ${knowledgeBasePath}`);
    console.error('\nPlease create the directory and add your documentation files.');
    process.exit(1);
  }

  const documents = [
    {
      file: path.join(knowledgeBasePath, 'company-info.md'),
      category: CATEGORIES.COMPANY,
      title: 'Información de Camaral',
    },
    {
      file: path.join(knowledgeBasePath, 'product-features.md'),
      category: CATEGORIES.PRODUCT,
      title: 'Características del Producto',
    },
    {
      file: path.join(knowledgeBasePath, 'faqs.md'),
      category: CATEGORIES.FAQ,
      title: 'Preguntas Frecuentes',
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const doc of documents) {
    try {
      await ingestDocument(doc.file, doc.category, doc.title);
      successCount++;
    } catch (error) {
      console.error(`\n❌ Failed to ingest ${doc.title}:`, error);
      errorCount++;
    }
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  ✨ Ingestion Summary                     ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`\n✅ Successfully ingested: ${successCount} documents`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} documents`);
  }
  console.log('\n🎉 Done! You can now start the chatbot.\n');
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error during ingestion:', error);
  process.exit(1);
});