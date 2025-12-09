"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, BookOpen, History, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: number;
  type: "question" | "answer";
  text: string;
  source?: string;
  sources?: Array<{
    text: string;
    source_file: string;
    page_idx: number;
    score: number;
  }>;
}

export function LeftPanel() {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // If no token, show a message
  if (!token) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-400">
        Please sign in to use the chat feature
      </div>
    );
  }

  const historyItems = [
    { id: 1, text: "Education policy amendments 2024", time: "2 hours ago" },
    { id: 2, text: "Teacher training requirements", time: "Yesterday" },
    { id: 3, text: "Student assessment guidelines", time: "3 days ago" },
  ];

  const handleAskQuestion = async () => {
    if (!query.trim() || loading) return;

    const userQuestion = query.trim();
    const questionId = Date.now();
    
    // Add user question to messages
    setMessages((prev) => [
      ...prev,
      {
        id: questionId,
        type: "question",
        text: userQuestion,
      },
    ]);

    setQuery("");
    setLoading(true);

    try {
      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const createResponse = await fetch("http://127.0.0.1:8000/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: userQuestion.substring(0, 50),
          }),
        });

        if (createResponse.ok) {
          const conversationData = await createResponse.json();
          currentConversationId = conversationData.conversation_id;
          setConversationId(currentConversationId);
        }
      }

      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: userQuestion,
          conversation_id: currentConversationId,
          top_k: 5,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI answer to messages
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "answer",
          text: data.answer,
          source: data.sources?.[0]
            ? `${data.sources[0].source_file}, Page ${data.sources[0].page_idx}`
            : "No source available",
          sources: data.sources,
        },
      ]);
    } catch (error) {
      console.error("Error fetching answer:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "answer",
          text: "❌ Error: Could not connect to the backend. Please ensure the server is running on http://localhost:8000",
          source: "Error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Query & Reference</h2>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-3 bg-gray-100">
          <TabsTrigger value="chat" className="flex-1 text-xs">
            <MessageSquare className="w-4 h-4 mr-2" />
            RAG Chat
          </TabsTrigger>
          <TabsTrigger value="refs" className="flex-1 text-xs">
            <BookOpen className="w-4 h-4 mr-2" />
            Reference
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="flex-1 mb-3 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Ask a question about policies</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your AI assistant is ready to help
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 ${
                      msg.type === "question"
                        ? "bg-gray-100"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <p className="text-xs text-gray-900 whitespace-pre-wrap">
                      {msg.text}
                    </p>
                    {msg.type === "answer" && msg.source && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-[10px] text-gray-600">
                          📄 Source: {msg.source}
                        </p>
                        {msg.sources && msg.sources.length > 1 && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            +{msg.sources.length - 1} more sources
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-xs text-gray-600">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Ask about policies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Button
              size="icon"
              onClick={handleAskQuestion}
              disabled={!query.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="refs" className="flex-1 p-3">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {["NEP 2020 Guidelines", "RTE Act Provisions", "Assessment Protocols"].map(
                (ref, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition"
                  >
                    <p className="text-xs font-medium text-gray-900">{ref}</p>
                    <p className="text-[10px] text-gray-600 mt-1">Framework</p>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-3">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition"
                >
                  <p className="text-xs text-gray-900 line-clamp-1">{item.text}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{item.time}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}