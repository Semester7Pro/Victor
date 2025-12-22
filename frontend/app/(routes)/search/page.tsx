"use client";

import { useState } from "react";
import Link from "next/link";
// import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/lib/ThemeContext";
// import { PolicyAssistDrafter } from "@/components/PolicyAssistDrafter";
import { useAuth } from "@clerk/nextjs";
import OrbitalLoader from "@/components/ui/OrbitalLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ArrowLeft, FileText, Database, Brain, Sparkles } from "lucide-react";
import { PDFViewer } from "@/components/PDFviewer";


interface SearchResult {
  text: string;
  source_file: string;
  page_idx: number;
  score: number;
  global_chunk_id?: string;
  document_id?: string;
  chunk_index?: number;
  section_hierarchy?: string;
  char_count?: number;
  word_count?: number;
   bbox?: number[];
}

interface RAGResponse {
  query: string;
  answer: string;
  sources: SearchResult[];
  model_used: string;
}

export default function PolicyDrafterPage() {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RAGResponse | null>(null);
  const [message, setMessage] = useState("");
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) {
      setMessage("Please enter a search query");
      return;
    }

    setSearching(true);
    setMessage("");
    console.log("Searching for:", query);

    try {
      const token = await getToken(); 
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: query,
          top_k: 10,
          temperature: 0.1,
        }),
      });

      console.log("Ask response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Search error:", errorText);
        console.log("Response status:", response.status);

        if (response.status === 503) {
          setMessage(" Backend service unavailable. Please start the backend server.");
        } else if (response.status === 500) {
          try {
            const errorData = JSON.parse(errorText);
            setMessage(` Server Error: ${errorData.detail || "Internal server error"}`);
          } catch {
            setMessage("❌ Internal server error. Check backend logs for details.");
          }
        } else if (response.status === 422) {
          try {
            const errorData = JSON.parse(errorText);
            console.log("Validation error details:", errorData);
            setMessage(`❌ Validation Error: ${JSON.stringify(errorData.detail)}`);
          } catch {
            setMessage(`❌ Validation Error (422): Invalid request format`);
          }
        } else if (response.status === 404) {
          setMessage("❌ Search endpoint not found. Please check backend is running.");
        } else {
          try {
            const errorData = JSON.parse(errorText);
            setMessage(`❌ Error (${response.status}): ${errorData.detail || errorText}`);
          } catch {
            setMessage(`❌ Error (${response.status}): ${errorText || "Unknown error"}`);
          }
        }
        setResults(null);
        return;
      }

      const data = await response.json();
      console.log("RAG Response:", data);

      if (data.sources && data.sources.length > 0) {
        console.log(` Retrieved ${data.sources.length} relevant chunks:`);
        data.sources.forEach((source: any, idx: number) => {
          console.log(`[Chunk ${idx + 1}] ${source.text.substring(0, 150)}...`);
        });
      }

      

      if (data.answer) {
        setResults(data);
        setMessage(` Answer generated using ${data.model_used}`);
      } else {
        setResults(null);
        setMessage("No answer generated. Please try again.");
      }
    } catch (err) {
      console.log("Ask error:", err);

      if (err instanceof TypeError) {
        if (err.message.includes("Failed to fetch")) {
          setMessage(" Cannot connect to backend. Is the server running on http://localhost:8000?");
        } else if (err.message.includes("NetworkError")) {
          setMessage(" Network error: Please check your connection and ensure backend is running");
        } else {
          setMessage(` Network Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setMessage(` Error: ${err.message}`);
      } else {
        setMessage(" An unexpected error occurred. Please check the backend logs.");
      }

      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  return (
    <main
      data-theme={theme}
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      {/* Tricolor Header Bar */}
      <div className="tricolor-bar h-1.5 w-full" />

      {/* Navigation Header */}
      <header 
        className="border-b backdrop-blur-sm sticky top-0 z-50"
        style={{
          borderColor: 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--card) / 0.8)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--accent)))`
              }}
            >
              <SearchIcon 
                className="w-4 h-4"
                style={{ color: 'hsl(var(--primary-foreground))' }}
              />
            </div>
            <div>
              <h1 
                className="text-lg font-bold tracking-tight"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Victor Search
              </h1>
              <p 
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Intelligent Document Discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <ThemeToggle /> */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="flex items-center gap-1.5 text-xs border"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Panel - Search Interface */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto px-6 py-8">
          {/* Search Header */}
          <div className="mb-6">
            <h2 
              className="text-2xl font-bold mb-1"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Ask a Question
            </h2>
            <p 
              className="text-sm"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              AI-powered semantic search across your document repository
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="mb-6">
            <div 
              className="relative flex items-center gap-2 p-1.5 border rounded-xl shadow-sm transition-all"
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--primary) / 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <SearchIcon 
                className="w-4 h-4 ml-3"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Input
                type="text"
                placeholder="What do you want to know?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-9"
                style={{ color: 'hsl(var(--foreground))' }}
              />
              <Button
                type="submit"
                disabled={searching || !query.trim()}
                size="sm"
                className="px-4 rounded-lg font-medium transition-all disabled:opacity-50"
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
                Search
              </Button>
            </div>
          </form>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { label: "Vector Search", icon: Database },
              { label: "Semantic AI", icon: Brain },
              { label: "Hybrid Ranking", icon: Sparkles },
            ].map((tech) => (
              <div
                key={tech.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))'
                }}
              >
                <tech.icon className="w-3 h-3" />
                {tech.label}
              </div>
            ))}
          </div>

          {/* Status Message */}
          {message && (
            <div
              className="px-4 py-3 rounded-lg text-sm font-semibold border mb-6"
              style={{
                backgroundColor: message.startsWith("✅")
                  ? 'hsl(var(--accent) / 0.1)'
                  : 'hsl(var(--destructive) / 0.1)',
                color: message.startsWith("✅")
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--destructive))',
                borderColor: message.startsWith("✅")
                  ? 'hsl(var(--accent) / 0.3)'
                  : 'hsl(var(--destructive) / 0.3)'
              }}
            >
              {message}
            </div>
          )}

          {/* Results Area */}
          <div className="flex-1">
            {/* Initial State */}
            {!results && !searching && !message && (
              <div className="flex flex-col items-center justify-center py-12">
                <OrbitalLoader isActive={false} centerLabel="V" />
                <p 
                  className="text-sm mt-6 text-center max-w-md"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Enter a query to search across all your uploaded documents using advanced AI retrieval
                </p>
              </div>
            )}

            {/* Searching State */}
            {searching && (
              <div className="flex flex-col items-center justify-center py-8">
                <OrbitalLoader isActive={true} centerLabel="V" />
                <div className="mt-6 text-center">
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    Processing Query
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    Running through Ollama, BGE embeddings, Milvus VectorDB, and cross-encoder reranking...
                  </p>
                </div>
              </div>
            )}

            {/* Results Display */}
            {results && !searching && (
              <div className="space-y-6">
                {/* AI Answer Card */}
                <div 
                  className="border rounded-xl p-6"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 
                        className="text-lg font-bold mb-1"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        Answer
                      </h3>
                      <p 
                        className="text-xs"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        Generated by {results.model_used}
                      </p>
                    </div>
                  </div>
                  <div 
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {results.answer}
                  </div>
                </div>

                  
                {/* Sources Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 
                        className="text-lg font-bold mb-1"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        Referenced Sources
                      </h3>
                      <p 
                        className="text-xs"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {results.sources?.length || 0} document chunks used
                      </p>
                    </div>
                    <div 
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'hsl(var(--accent))' }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Ranked by relevance
                    </div>
                  </div>

                  <div className="space-y-3">
                    {results.sources?.map((source, index) => {
                      const displayFile = source.source_file || "Unknown";
                      const pageNum = (source.page_idx ?? 0) + 1;
                      const scorePct = source.score ? Math.round(source.score * 100) : undefined;

                      return (
                        <div
                          key={index}
                          className="border rounded-lg p-4 transition-all cursor-pointer group"
                          style={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                              style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                            >
                              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4
                                  className="font-medium text-sm truncate transition-colors"
                                  style={{ color: 'hsl(var(--foreground))' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--primary))')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                                >
                                  {displayFile}
                                </h4>
                                {scorePct !== undefined && (
                                  <span
                                    className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}
                                  >
                                    {scorePct}%
                                  </span>
                                )}
                              </div>

                              <p className="text-xs line-clamp-2 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {source.text}
                              </p>

                              <div className="flex items-center gap-3 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5" />
                                  Page {pageNum}
                                </span>
                                <button
                                  onClick={() => setSelectedSourceIndex(index)}
                                  
                                  className="underline hover:no-underline"
                                  style={{ color: 'hsl(var(--primary))' }}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {/* // In your modal section, update the page number calculation: */}

{selectedSourceIndex !== null && results && results.sources[selectedSourceIndex] && (
  (() => {
    const s = results.sources[selectedSourceIndex];
    const fileField = s.source_file || s.document_id || "";
    
    // ✅ FIX: Backend stores 0-indexed pages, PDF.js needs 1-indexed
    // If page_idx = 0 → PDF page 1
    // If page_idx = 1 → PDF page 2
    // If page_idx = 2 → PDF page 3
    const pageIdxRaw = s.page_idx ?? 0;
    const pageNum = pageIdxRaw + 1; // Convert 0-indexed to 1-indexed
    
    console.log("=".repeat(80));
    console.log("📋 PAGE NUMBER CONVERSION:");
    console.log(`  Backend page_idx (0-indexed): ${pageIdxRaw}`);
    console.log(`  PDF.js page (1-indexed): ${pageNum}`);
    console.log("=".repeat(80));

    // Extract relative path for PDF URL
    let relativePath: string | undefined;
    const m = (fileField || "").match(/data[\\/](.*)$/i);
    if (m && m[1]) {
      relativePath = m[1];
    } else if (fileField && (fileField.includes("/") || fileField.includes("\\"))) {
      relativePath = fileField.split(/[\\/]/).pop();
    } else if (s.document_id) {
      relativePath = `uploads/${s.document_id}/v1/original.pdf`;
    } else if (fileField) {
      relativePath = fileField;
    }
    
    const backendPdfUrl = relativePath 
      ? `http://localhost:8000/pdf/${encodeURIComponent(relativePath)}` 
      : undefined;

    return (
      <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
           style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}>
        <div className="rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col border shadow-2xl" 
             style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" 
               style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1" 
                  style={{ color: 'hsl(var(--foreground))' }}>
                {fileField || s.document_id || "Document"}
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                📄 Page {pageNum} • Relevance: {(s.score ? (s.score * 100).toFixed(1) : "N/A")}%
              </p>
            </div>
            <button 
              onClick={() => setSelectedSourceIndex(null)} 
              className="text-2xl hover:opacity-70 transition-opacity" 
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              ✕
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {backendPdfUrl ? (
              <PDFViewer 
                fileUrl={backendPdfUrl} 
                page={pageNum}  // ✅ Now passing correct 1-indexed page
                highlightText={s.text} 
              />
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ PDF preview not available
                </p>
                <div className="p-4 bg-white border rounded">
                  <p className="text-xs font-semibold mb-2 text-gray-700">Referenced Text:</p>
                  <p className="text-sm text-gray-800">{s.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex gap-3 justify-end" 
               style={{ borderColor: 'hsl(var(--border))' }}>
            <button 
              onClick={() => setSelectedSourceIndex(null)} 
              className="px-4 py-2 rounded hover:opacity-90 transition-opacity" 
              style={{ 
                backgroundColor: 'hsl(var(--primary))', 
                color: 'hsl(var(--primary-foreground))' 
              }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  })()
)}
      {/* Footer */}
      <footer 
        className="border-t py-3"
        style={{
          borderColor: 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--card) / 0.5)'
        }}
      >
        <div 
          className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[10px]"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <p>Victor • Intelligent Document Search</p>
          <div className="flex items-center gap-3">
            <span>Milvus VectorDB</span>
            <span>•</span>
            <span>BGE Embeddings</span>
            <span>•</span>
            <span>Cross-Encoder Reranking</span>
          </div>
        </div>
      </footer>
    </main>
  );}