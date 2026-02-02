import { ChatInterface } from "@/components/chat/chat-interface";

export default function Home() {
  return (
    <main className="h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      
      <div className="w-full max-w-4xl h-full max-h-225 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <ChatInterface />
      </div>

    </main>
  );
}