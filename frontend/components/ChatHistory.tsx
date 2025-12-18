"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Plus, Trash2, MessageCircle, Clock } from "lucide-react";

interface Message {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: Array<{
    doc_id: string;
    source: string;
    page: number;
    score: number;
    snippet: string;
  }>;
}

interface Conversation {
  conversation_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  message_count?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatHistory() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`);
      if (!response.ok) throw new Error("Failed to load conversations");
      const data = await response.json();
      setConversations(data.conversations || []);
      
      // Auto-select first conversation
      if (data.conversations && data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0].conversation_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading conversations");
    }
  };

  // Fetch messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/conversations/${conversationId}/messages`
      );
      if (!response.ok) throw new Error("Failed to load messages");
      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading messages");
      setMessages([]);
    }
  };

  // Send new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const query = inputValue;
    setInputValue("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversation_id: selectedConversation,
          top_k: 5,
          temperature: 0.1,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const result = await response.json();

      // Update conversation ID if new conversation was created
      if (result.conversation_id !== selectedConversation) {
        setSelectedConversation(result.conversation_id);
      }

      // Reload messages
      await loadMessages(result.conversation_id || selectedConversation || "");
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (!response.ok) throw new Error("Failed to create conversation");
      const data = await response.json();

      setSelectedConversation(data.conversation_id);
      setMessages([]);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating conversation");
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE}/conversations/${conversationId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete conversation");

      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting conversation");
    }
  };

  return (
    <div className={`flex h-screen ${isDark ? "bg-neutral-900" : "bg-white"} rounded-xl overflow-hidden border ${isDark ? "border-neutral-700" : "border-gray-200"}`}>
      {/* Sidebar - Conversations List */}
      <div className={`w-72 border-r ${isDark ? "border-neutral-700" : "border-gray-200"} flex flex-col ${isDark ? "bg-neutral-900/30" : "bg-gray-50/30"}`}>
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? "border-neutral-700" : "border-gray-200"}`}>
          <button
            onClick={createNewConversation}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isDark
                ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                : "bg-cyan-500 hover:bg-cyan-600 text-white"
            }`}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className={`text-center py-8 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversation_id}
                onClick={() => setSelectedConversation(conv.conversation_id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedConversation === conv.conversation_id
                    ? isDark
                      ? "bg-cyan-600/15 border border-cyan-600/30"
                      : "bg-cyan-500/15 border border-cyan-500/30"
                    : `hover:${isDark ? "bg-neutral-800" : "bg-gray-100"} border border-transparent`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedConversation === conv.conversation_id
                      ? isDark ? "bg-cyan-600/20" : "bg-cyan-500/20"
                      : isDark ? "bg-neutral-800" : "bg-gray-100"
                  }`}>
                    <MessageCircle className={`w-4 h-4 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {conv.title}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      <Clock className="w-3 h-3" />
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.conversation_id, e)}
                    className={`opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded transition-all duration-200 ${
                      isDark
                        ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        : "text-red-600 hover:text-red-700 hover:bg-red-600/10"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              isDark
                ? "bg-red-900/30 text-red-300 border border-red-700"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {error}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDark ? "bg-cyan-600/10" : "bg-cyan-500/10"
              }`}>
                <MessageCircle className={`w-8 h-8 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                No messages yet
              </h3>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Start a conversation to see chat history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? `${isDark ? "bg-cyan-600" : "bg-cyan-500"} text-white rounded-br-md`
                        : `${isDark ? "bg-neutral-800" : "bg-gray-100"} ${isDark ? "text-gray-100" : "text-gray-900"} rounded-bl-md`
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-xs font-medium mb-2 opacity-80">Sources:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, idx) => (
                            <p key={idx} className="text-xs opacity-70">
                              📄 {source.source}
                              {source.page && ` (p. ${source.page})`}
                              {source.score && ` - ${(source.score * 100).toFixed(0)}%`}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs mt-2 opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isDark ? "border-neutral-700 bg-neutral-900/30" : "border-gray-200 bg-gray-50/30"}`}>
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 ${
                isDark
                  ? "bg-neutral-800 text-white placeholder-gray-500 border-neutral-700"
                  : "bg-white text-gray-900 placeholder-gray-400 border-gray-300"
              } disabled:opacity-50`}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                isDark
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                  : "bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
              }`}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}