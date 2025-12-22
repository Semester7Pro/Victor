'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
const CompareModal = dynamic(() => import('./CompareModal'), { ssr: false });
import { useRouter } from 'next/navigation';
import DockRoot from '@/components/Dock';
import VoiceInput from '@/components/VoiceInput';
import FilterDropdown, { SearchFilters } from '@/components/FilterDropdown';
import { Moon, Sun, Wifi, User, Bot, Filter, Languages, Mic, MicOff, Send, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface Message {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources?: Array<{
    text: string;
    source_file?: string;
    page_idx?: number;
    score?: number;
    document_name?: string;
    page?: number;
  }>;
}

interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface ChatResponse {
  method: string;
  answer: string;
  conversation_id: string;
  sources?: Array<any>;
}

interface ChatInterfaceProps {
  authToken: string;
  userName?: string;
  userAvatar?: string;
}

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

export default function ChatInterface({ authToken, userName = 'User', userAvatar }: ChatInterfaceProps) {
  const [compareOpen, setCompareOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('New Chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topK, setTopK] = useState(3);
  const [temperature, setTemperature] = useState(0.1);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  // const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation);
    }
  }, [currentConversation]);

  const loadConversations = useCallback(async () => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const convs = data.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !currentConversation) {
          setCurrentConversation(convs[0].conversation_id);
          setCurrentTitle(convs[0].title);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [authToken, API_URL, currentConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Conversation' }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConversation: Conversation = {
          conversation_id: data.conversation_id,
          title: data.title || 'New Conversation',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          message_count: data.message_count || 0,
        };

        setConversations([newConversation, ...conversations]);
        setCurrentConversation(data.conversation_id);
        setCurrentTitle(data.title || 'New Conversation');
        setMessages([]);
        setInputValue('');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setSearchFilters(newFilters);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentConversation) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const userMsg: Message = {
        message_id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);

      const requestBody: any = {
        query: userMessage,
        conversation_id: currentConversation,
        top_k: topK,
        temperature,
        method: "hybrid",
      };

      if (searchFilters.category) requestBody.category = searchFilters.category;
      if (searchFilters.language) requestBody.language = searchFilters.language;
      if (searchFilters.document_type) requestBody.document_type = searchFilters.document_type;
      if (searchFilters.document_id) requestBody.document_id = searchFilters.document_id;
      if (searchFilters.date_from) requestBody.date_from = searchFilters.date_from;
      if (searchFilters.date_to) requestBody.date_to = searchFilters.date_to;

      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data: ChatResponse = await response.json();
        const assistantMsg: Message = {
          message_id: Date.now().toString() + '1',
          role: 'assistant',
          content: data.answer,
          created_at: new Date().toISOString(),
          sources: data.sources,
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (currentTitle === 'New Conversation') {
          const newTitle = userMessage.substring(0, 50);
          setCurrentTitle(newTitle);
          setConversations(prev => 
            prev.map(conv => 
              conv.conversation_id === currentConversation 
                ? { ...conv, title: newTitle }
                : conv
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      setConversations(conversations.filter((c) => c.conversation_id !== conversationId));
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // const handleVoiceToggle = () => {
  //   setIsRecording(!isRecording);
  // };

  const handleVoiceTranscript = (transcript: string) => {
    console.log('📝 Voice transcript received:', transcript);
    setInputValue(transcript);
    // Optionally auto-submit after receiving transcript
    // setTimeout(() => {
    //   if (transcript.trim()) {
    //     const submitEvent = new Event('submit') as any;
    //     sendMessage(submitEvent);
    //   }
    // }, 100);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(new Event('submit') as any);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentLanguage = languages.find((l) => l.code === selectedLanguage) || languages[0];

const dockItems = [
    {
      // 1. Create new chat
      icon: (
        <svg
          className="w-5 h-5 "
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      label: 'New chat',
      onClick: () => createNewChat(),
      isActive: false,
    },  
    {
      // 2. View chat history
      icon: (
        <svg
          className="w-5 h-5 "
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      label: 'Chat history',
      onClick: () => setSidebarOpen((prev) => !prev),
      isActive: sidebarOpen,
    },
    {
      // 3. Upload doc
      icon: (
        <svg
          className="w-5 h-5 "
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      ),
      label: 'Upload doc',
      onClick: () => router.push('/upload'),
    },
    {
      // 4. Search doc
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
      ),
      label: 'Search docs',
      onClick: () => router.push('/search'),
    },
    {
      // 5. Back to landing page
      icon: (
        <svg
          className="w-5 h-5 "
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
          />
        </svg>
      ),
      label: 'Back to home',
      onClick: () => router.push('/'),
    },
    {
      // 6. User name item
      icon: (
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-600">
          <svg
            className="w-4 h-4 text-neutral-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20a6 6 0 0112 0"
            />
          </svg>
        </div>
      ),
      label: userName,
      onClick: () => {
        // you can open a profile / settings modal here later
        console.log('User item clicked');
      },
    },
  ];

  return (
    <div className="relative flex h-screen bg-background">
      <DockRoot
        items={dockItems}
        className="bg-sidebar-background/95 border-sidebar-border shadow-2xl"
        panelWidth={64}
        dockWidth={80}
        baseItemSize={48}
        magnification={72}
        distance={200}
      />

      <div className="flex-1 flex ml-4">
        {sidebarOpen && (
          <div className="w-72 h-full bg-card border border-border rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col mr-4">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--saffron))]/20 to-[hsl(var(--gov-green))]/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🇮🇳</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">भारत RAG</h2>
                    <p className="text-xs text-muted-foreground">AI Document Assistant</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              </div>
              <Button onClick={createNewChat} className="w-full gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Conversation
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    <p className="font-medium">No conversations</p>
                    <p className="text-xs mt-1">Create one to get started</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      onClick={() => {
                        setCurrentConversation(conv.conversation_id);
                        setCurrentTitle(conv.title);
                      }}
                      className={cn(
                        "p-3 rounded-xl cursor-pointer transition-all group",
                        currentConversation === conv.conversation_id
                          ? "bg-[hsl(var(--saffron))]/10 border border-[hsl(var(--saffron))]"
                          : "bg-muted border border-border hover:border-[hsl(var(--saffron))]/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-foreground">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(conv.updated_at)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.conversation_id);
                          }}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

<div className="flex-1 flex flex-col" style={{ backgroundColor: 'hsl(var(--background))' }}>
  <header 
    className="flex items-center justify-between px-4 py-3 border-b"
    style={{
      backgroundColor: 'hsl(var(--card))',
      borderColor: 'hsl(var(--border))'
    }}
  >
    {/* Left section */}
    <div className="flex items-center gap-3">
      <div>
        <h1 
          className="text-lg font-semibold"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {currentTitle || 'New Conversation'}
        </h1>
        <p 
          className="text-sm"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {messages.length > 0 ? `${messages.length} message${messages.length !== 1 ? 's' : ''}` : 'Ask anything about your documents'}
        </p>
      </div>
    </div>

    {/* Right section */}
    <div className="flex items-center gap-4">
      {/* Status indicator */}
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: 'hsl(var(--accent) / 0.1)',
          color: 'hsl(var(--accent))'
        }}
      >
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-medium">LangChain RAG</span>
        <span 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'hsl(var(--accent))' }}
        />
      </div>

      {/* Theme toggle */}
      {/* <ThemeToggle /> */}

      {/* User profile */}
      <div className="flex items-center gap-2">
        <Avatar 
          className="h-9 w-9 border-2"
          style={{ borderColor: 'hsl(var(--primary))' }}
        >
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback 
            className="font-medium"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))'
            }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p 
            className="text-sm font-medium"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {userName}
          </p>
          <p 
            className="text-xs flex items-center gap-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--accent))' }}
            />
            Online
          </p>
        </div>
      </div>
    </div>
  </header>

<ScrollArea className="flex-1 px-4 py-6">
  <div className="max-w-3xl mx-auto space-y-6">
    {messages.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{
            background: `linear-gradient(to bottom right, hsl(var(--saffron) / 0.2), hsl(var(--gov-green) / 0.2))`
          }}
        >
          <span className="text-4xl">🇮🇳</span>
        </div>
        <h2 
          className="text-xl font-semibold mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Welcome to भारत RAG Portal
        </h2>
        <p 
          className="max-w-md"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Ask questions about government policies, acts, and documents. Use voice input or type in your preferred language.
        </p>
        <div className="flex gap-2 mt-6 flex-wrap justify-center">
          {["NEP 2020", "RTI Act", "Digital India", "Ayushman Bharat"].map((tag) => (
            <span 
              key={tag} 
              className="px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors"
              style={{
                backgroundColor: 'hsl(var(--saffron) / 0.1)',
                color: 'hsl(var(--saffron))',
                borderColor: 'hsl(var(--saffron) / 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--saffron) / 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--saffron) / 0.1)'}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    ) : (
      messages.map((message) => (
        <div key={message.message_id} className={cn("flex gap-3 animate-fade-in", message.role === 'user' ? "flex-row-reverse" : "flex-row")}>
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: message.role === 'user' 
                ? 'hsl(var(--chat-user))' 
                : 'hsl(var(--secondary))'
            }}
          >
            {message.role === 'user' ? (
              <User 
                className="h-4 w-4"
                style={{ color: 'hsl(var(--primary-foreground))' }}
              />
            ) : (
              <Bot 
                className="h-4 w-4"
                style={{ color: 'hsl(var(--secondary-foreground))' }}
              />
            )}
          </div>
          <div 
            className={cn(
              "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm", 
              message.role === 'user' ? "rounded-br-sm" : "rounded-bl-sm"
            )}
            style={{
              backgroundColor: message.role === 'user' 
                ? 'hsl(var(--chat-user))' 
                : 'hsl(var(--chat-assistant))',
              color: message.role === 'user'
                ? 'hsl(var(--primary-foreground))'
                : 'hsl(var(--foreground))'
            }}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <p 
              className="text-xs mt-2"
              style={{
                color: message.role === 'user' 
                  ? 'hsl(var(--primary-foreground) / 0.7)' 
                  : 'hsl(var(--muted-foreground))'
              }}
            >
              {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))
    )}
    <div ref={bottomRef} />
  </div>
</ScrollArea>

<div 
  className="border-t p-4"
  style={{
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))'
  }}
>
  {/* Language indicator */}
  <div className="flex justify-center mb-3">
    <span 
      className="text-xs flex items-center gap-1"
      style={{ color: 'hsl(var(--muted-foreground))' }}
    >
      {currentLanguage.flag} {currentLanguage.label}
    </span>
  </div>

  {/* Main input row */}
  <div className="flex items-center gap-2">
    {/* Filter dropdown */}
    <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <FilterDropdown 
            onFilterChange={handleFilterChange}
            currentFilters={searchFilters}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>Filter Documents</TooltipContent>
    </Tooltip>

    {/* Language selector */}
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              style={{
                borderColor: 'hsl(var(--border))'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
              }}
            >
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Select Language</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setSelectedLanguage(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
            style={{
              backgroundColor: selectedLanguage === lang.code 
                ? 'hsl(var(--primary) / 0.1)' 
                : 'transparent'
            }}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {selectedLanguage === lang.code && (
              <span 
                className="ml-auto"
                style={{ color: 'hsl(var(--primary))' }}
              >
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

  {/* Voice input button - Styled like language selector */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {/* Add your voice handler */}}
          className="h-10 w-10 shrink-0"
          style={{
            borderColor: 'hsl(var(--border))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
            e.currentTarget.style.borderColor = 'hsl(var(--primary))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.borderColor = 'hsl(var(--border))';
          }}
        >
          <Mic className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Voice Input</TooltipContent>
    </Tooltip>

    {/* Text input */}
    <div className="flex-1 relative">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your question or use voice input..."
        className="h-10 pr-10"
        style={{
          backgroundColor: 'hsl(var(--chat-input-bg))',
          borderColor: 'hsl(var(--border))'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'hsl(var(--primary))';
          e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'hsl(var(--border))';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>

    {/* Send button */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="h-10 px-4 gap-2"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.9)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
          }}
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Send Message</TooltipContent>
    </Tooltip>

    {/* Compare button */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          onClick={() => setCompareOpen(true)}
          className="h-10 px-4 gap-2"
          style={{
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--secondary-foreground))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--secondary) / 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
          }}
        >
          <GitCompare className="h-4 w-4" />
          <span className="hidden sm:inline">Compare</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Compare Topics</TooltipContent>
    </Tooltip>
    </TooltipProvider>
  </div>

  {/* Helper text */}
  <div className="flex justify-center mt-3">
    <p 
      className="text-xs"
      style={{ color: 'hsl(var(--muted-foreground))' }}
    >
      Hybrid search with filters • Voice input • English, Hindi, Tamil & more
    </p>
  </div>
</div>
</div>
</div>

      
      {compareOpen && <CompareModal open={compareOpen} authToken={authToken} onClose={() => setCompareOpen(false)} />}
    </div>
  );
}