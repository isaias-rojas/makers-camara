# Camaral AI Chatbot

This is a **simple AI Chatbot** for Camaral, utilizing **Retrieval-Augmented Generation (RAG)** to provide accurate answers from a knowledge base. It includes **session persistence** to remember past conversations.

## Prerequisites

*   **Node.js** (v18+)
*   **PNPM** (recommended) or NPM
*   **OpenAI API Key** (needs access to GPT-4 and Embeddings)
*   **Pinecone API Key** and Index

## Setup & Run

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory with the following keys:
    ```env
    OPENAI_API_KEY="sk-..."
    PINECONE_API_KEY="pc-..."
    PINECONE_INDEX_NAME="camaral-index"
    ```

3.  **Ingest Knowledge Base:**
    Run this script to upload your markdown documents to Pinecone:
    ```bash
    pnpm run ingest
    ```

4.  **Start the App:**
    ```bash
    pnpm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.