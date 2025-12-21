"use client";

import { useState } from "react";
import { X, GitCompare, Send, Loader2, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CompareSource {
  text: string;
  source_file?: string;
  document_name?: string;
  page_idx?: number;
  normalized_score?: number;
  document_id?: string;
}

interface CompareResult {
  topic1: string;
  topic2: string;
  topic1_answer: string;
  topic2_answer: string;
  comparison_analysis: string;
  topic1_sources: CompareSource[];
  topic2_sources: CompareSource[];
  total_latency_ms: number;
}

interface CompareModalProps {
  authToken: string;
  open: boolean;
  onClose: () => void;
}

export default function CompareModal({ authToken, open, onClose }: CompareModalProps) {
  const [topic1, setTopic1] = useState("");
  const [topic2, setTopic2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const handleCompare = async () => {
    if (!topic1.trim() || !topic2.trim()) {
      alert("Please enter both topics to compare");
      return;
    }
    setLoading(true);
    setResult(null);
    setFollowUpAnswer("");
    try {
      const response = await fetch(`${API_URL}/compare`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic1: topic1.trim(),
          topic2: topic2.trim(),
          method: "hybrid",
          top_k: 5,
          temperature: 0.1,
        }),
      });
      if (!response.ok) {
        throw new Error("Comparison failed");
      }
      const data: CompareResult = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Comparison error:", error);
      alert(`Failed to compare: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuery.trim() || !result) return;
    setFollowUpLoading(true);
    try {
      const contextPrompt = `Based on the comparison between \"${result.topic1}\" and \"${result.topic2}\":\n\nPrevious Analysis:\n${result.comparison_analysis}\n\nFollow-up Question: ${followUpQuery}\n\nPlease answer the follow-up question in the context of this comparison, using information from both topics.`;
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: contextPrompt,
          method: "hybrid",
          top_k: 5,
          temperature: 0.1,
        }),
      });
      if (!response.ok) {
        throw new Error("Follow-up query failed");
      }
      const data = await response.json();
      setFollowUpAnswer(data.answer);
      setFollowUpQuery("");
    } catch (error: any) {
      console.error("Follow-up error:", error);
      alert(`Failed to get answer: ${error.message}`);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setTopic1("");
    setTopic2("");
    setFollowUpAnswer("");
    setFollowUpQuery("");
  };

return (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent 
      className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))'
      }}
    >
      <DialogHeader>
        <DialogTitle 
          className="flex items-center gap-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          <GitCompare 
            className="h-5 w-5"
            style={{ color: 'hsl(var(--secondary))' }}
          />
          Compare Topics
        </DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-auto">
        {!result ? (
          <div className="space-y-4 py-4">
            {/* First Topic */}
            <div className="space-y-2">
              <Label style={{ color: 'hsl(var(--foreground))' }}>
                First Topic / Document
              </Label>
              <Input
                value={topic1}
                onChange={(e) => setTopic1(e.target.value)}
                placeholder="e.g., NEP 2020 digital education policy"
                className="border"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  borderColor: 'hsl(var(--border))'
                }}
                disabled={loading}
              />
            </div>

            {/* Second Topic */}
            <div className="space-y-2">
              <Label style={{ color: 'hsl(var(--foreground))' }}>
                Second Topic / Document
              </Label>
              <Input
                value={topic2}
                onChange={(e) => setTopic2(e.target.value)}
                placeholder="e.g., Previous education technology guidelines"
                className="border"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  borderColor: 'hsl(var(--border))'
                }}
                disabled={loading}
              />
            </div>

            {/* Compare Button */}
            <Button
              onClick={handleCompare}
              disabled={loading || !topic1.trim() || !topic2.trim()}
              className="w-full gap-2"
              style={{
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--secondary) / 0.9)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4" />
                  Compare Topics
                </>
              )}
            </Button>

            {/* How it works */}
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'hsl(var(--secondary) / 0.1)',
                borderColor: 'hsl(var(--secondary) / 0.2)'
              }}
            >
              <h4 
                className="text-sm font-medium flex items-center gap-2 mb-2"
                style={{ color: 'hsl(var(--secondary))' }}
              >
                <Lightbulb className="h-4 w-4" />
                How it works:
              </h4>
              <ul 
                className="text-sm space-y-1.5"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--secondary))' }}>•</span>
                  Enter two topics, policies, or document names
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--secondary))' }}>•</span>
                  We'll search both simultaneously using hybrid search
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--secondary))' }}>•</span>
                  Results are compared side-by-side with analysis
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'hsl(var(--secondary))' }}>•</span>
                  Ask follow-up questions to dig deeper
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Comparison Analysis */}
            <Card 
              className="border"
              style={{
                backgroundColor: 'hsl(var(--secondary) / 0.1)',
                borderColor: 'hsl(var(--secondary) / 0.2)'
              }}
            >
              <CardHeader>
                <CardTitle 
                  className="flex items-center gap-2"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  <GitCompare 
                    className="h-5 w-5"
                    style={{ color: 'hsl(var(--secondary))' }}
                  />
                  Comparison Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({...props}) => (
                        <div className="overflow-x-auto my-4">
                          <table 
                            className="min-w-full border-collapse border" 
                            style={{ borderColor: 'hsl(var(--border))' }}
                            {...props} 
                          />
                        </div>
                      ),
                      thead: ({...props}) => (
                        <thead 
                          style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
                          {...props} 
                        />
                      ),
                      th: ({...props}) => (
                        <th 
                          className="border px-4 py-2 text-left font-semibold" 
                          style={{
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--secondary))'
                          }}
                          {...props} 
                        />
                      ),
                      td: ({...props}) => (
                        <td 
                          className="border px-4 py-2" 
                          style={{
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--muted-foreground))'
                          }}
                          {...props} 
                        />
                      ),
                      h2: ({...props}) => (
                        <h2 
                          className="text-xl font-bold mt-6 mb-3" 
                          style={{ color: 'hsl(var(--foreground))' }}
                          {...props} 
                        />
                      ),
                      h3: ({...props}) => (
                        <h3 
                          className="text-lg font-semibold mt-4 mb-2" 
                          style={{ color: 'hsl(var(--secondary))' }}
                          {...props} 
                        />
                      ),
                      ul: ({...props}) => (
                        <ul 
                          className="list-disc list-inside space-y-1 my-3" 
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          {...props} 
                        />
                      ),
                      ol: ({...props}) => (
                        <ol 
                          className="list-decimal list-inside space-y-1 my-3" 
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          {...props} 
                        />
                      ),
                      strong: ({...props}) => (
                        <strong 
                          className="font-semibold" 
                          style={{ color: 'hsl(var(--foreground))' }}
                          {...props} 
                        />
                      ),
                      p: ({...props}) => (
                        <p 
                          className="my-2 leading-relaxed" 
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          {...props} 
                        />
                      ),
                    }}
                  >
                    {result.comparison_analysis}
                  </ReactMarkdown>
                </div>
                <div 
                  className="mt-4 text-xs"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Generated in {result.total_latency_ms.toFixed(0)}ms
                </div>
              </CardContent>
            </Card>

            {/* Side-by-Side Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Topic 1 */}
              <Card 
                className="border"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: 'hsl(var(--secondary))' }}>
                    {result.topic1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-sm mb-4 max-h-64 overflow-y-auto"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {result.topic1_answer}
                  </div>
                  {result.topic1_sources.length > 0 && (
                    <div 
                      className="border-t pt-4"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <p 
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        Sources ({result.topic1_sources.length})
                      </p>
                      <ul className="space-y-2 max-h-32 overflow-y-auto">
                        {result.topic1_sources.slice(0, 3).map((source, i) => (
                          <li 
                            key={i} 
                            className="text-xs"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            <span 
                              className="font-medium"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {source.document_id || source.document_name || 'Unknown'}
                            </span>
                            {source.page_idx && (
                              <span className="ml-2">(Page {source.page_idx})</span>
                            )}
                            {source.normalized_score && (
                              <span 
                                className="ml-2 px-1.5 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: 'hsl(var(--secondary) / 0.2)',
                                  color: 'hsl(var(--secondary))'
                                }}
                              >
                                {source.normalized_score.toFixed(1)}%
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Topic 2 */}
              <Card 
                className="border"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: 'hsl(var(--secondary))' }}>
                    {result.topic2}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-sm mb-4 max-h-64 overflow-y-auto"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {result.topic2_answer}
                  </div>
                  {result.topic2_sources.length > 0 && (
                    <div 
                      className="border-t pt-4"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <p 
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        Sources ({result.topic2_sources.length})
                      </p>
                      <ul className="space-y-2 max-h-32 overflow-y-auto">
                        {result.topic2_sources.slice(0, 3).map((source, i) => (
                          <li 
                            key={i} 
                            className="text-xs"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            <span 
                              className="font-medium"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {source.document_id || source.document_name || 'Unknown'}
                            </span>
                            {source.page_idx && (
                              <span className="ml-2">(Page {source.page_idx})</span>
                            )}
                            {source.normalized_score && (
                              <span 
                                className="ml-2 px-1.5 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: 'hsl(var(--secondary) / 0.2)',
                                  color: 'hsl(var(--secondary))'
                                }}
                              >
                                {source.normalized_score.toFixed(1)}%
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Follow-up Section */}
            <Card 
              className="border"
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))'
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: 'hsl(var(--foreground))' }}>
                  Follow-up Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFollowUp()}
                    placeholder="Ask a follow-up question about this comparison..."
                    className="flex-1 border"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      borderColor: 'hsl(var(--border))'
                    }}
                    disabled={followUpLoading}
                  />
                  <Button
                    onClick={handleFollowUp}
                    disabled={followUpLoading || !followUpQuery.trim()}
                    style={{
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--secondary-foreground))'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--secondary) / 0.9)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
                    }}
                  >
                    {followUpLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {followUpAnswer && (
                  <div 
                    className="mt-4 p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      borderColor: 'hsl(var(--border))'
                    }}
                  >
                    <p 
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {followUpAnswer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reset Button */}
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border"
              style={{
                borderColor: 'hsl(var(--border))'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Start New Comparison
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);
}