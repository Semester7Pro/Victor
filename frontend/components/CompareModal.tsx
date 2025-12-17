"use client";

import { useState } from "react";
import { X, GitCompare, Send, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  onClose: () => void;
}

export default function CompareModal({ authToken, onClose }: CompareModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-neutral-900 to-black border border-neutral-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 flex items-center justify-between bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <GitCompare className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Compare Topics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!result ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Topic / Document
                  </label>
                  <input
                    type="text"
                    value={topic1}
                    onChange={(e) => setTopic1(e.target.value)}
                    placeholder="e.g., NEP 2020 digital education policy"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Second Topic / Document
                  </label>
                  <input
                    type="text"
                    value={topic2}
                    onChange={(e) => setTopic2(e.target.value)}
                    placeholder="e.g., Previous education technology guidelines"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                onClick={handleCompare}
                disabled={loading || !topic1.trim() || !topic2.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-5 h-5" />
                    Compare Topics
                  </>
                )}
              </button>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                <p className="font-medium mb-2">💡 How it works:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Enter two topics, policies, or document names</li>
                  <li>We'll search both simultaneously using hybrid search</li>
                  <li>Results are compared side-by-side with analysis</li>
                  <li>Ask follow-up questions to dig deeper</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-purple-400" />
                  Comparison Analysis
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({...props}) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-neutral-600" {...props} />
                        </div>
                      ),
                      thead: ({...props}) => (
                        <thead className="bg-neutral-800/50" {...props} />
                      ),
                      th: ({...props}) => (
                        <th className="border border-neutral-600 px-4 py-2 text-left font-semibold text-purple-300" {...props} />
                      ),
                      td: ({...props}) => (
                        <td className="border border-neutral-600 px-4 py-2 text-gray-300" {...props} />
                      ),
                      h2: ({...props}) => (
                        <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />
                      ),
                      h3: ({...props}) => (
                        <h3 className="text-lg font-semibold text-purple-300 mt-4 mb-2" {...props} />
                      ),
                      ul: ({...props}) => (
                        <ul className="list-disc list-inside space-y-1 text-gray-300 my-3" {...props} />
                      ),
                      ol: ({...props}) => (
                        <ol className="list-decimal list-inside space-y-1 text-gray-300 my-3" {...props} />
                      ),
                      strong: ({...props}) => (
                        <strong className="font-semibold text-white" {...props} />
                      ),
                      p: ({...props}) => (
                        <p className="text-gray-300 my-2 leading-relaxed" {...props} />
                      ),
                    }}
                  >
                    {result.comparison_analysis}
                  </ReactMarkdown>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Generated in {result.total_latency_ms.toFixed(0)}ms
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">
                    {result.topic1}
                  </h3>
                  <div className="text-gray-300 text-sm mb-4 max-h-64 overflow-y-auto">
                    {result.topic1_answer}
                  </div>
                  {result.topic1_sources.length > 0 && (
                    <div className="border-t border-neutral-700 pt-4">
                      <p className="text-xs font-semibold text-gray-400 mb-2">
                        Sources ({result.topic1_sources.length})
                      </p>
                      <ul className="space-y-2 max-h-32 overflow-y-auto">
                        {result.topic1_sources.slice(0, 3).map((source, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            <span className="text-gray-400 font-medium">
                              {source.document_id || source.document_name || 'Unknown'}
                            </span>
                            {source.page_idx && (
                              <span className="ml-2">(Page {source.page_idx})</span>
                            )}
                            {source.normalized_score && (
                              <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                {source.normalized_score.toFixed(1)}%
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">
                    {result.topic2}
                  </h3>
                  <div className="text-gray-300 text-sm mb-4 max-h-64 overflow-y-auto">
                    {result.topic2_answer}
                  </div>
                  {result.topic2_sources.length > 0 && (
                    <div className="border-t border-neutral-700 pt-4">
                      <p className="text-xs font-semibold text-gray-400 mb-2">
                        Sources ({result.topic2_sources.length})
                      </p>
                      <ul className="space-y-2 max-h-32 overflow-y-auto">
                        {result.topic2_sources.slice(0, 3).map((source, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            <span className="text-gray-400 font-medium">
                              {source.document_id || source.document_name || 'Unknown'}
                            </span>
                            {source.page_idx && (
                              <span className="ml-2">(Page {source.page_idx})</span>
                            )}
                            {source.normalized_score && (
                              <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                {source.normalized_score.toFixed(1)}%
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Follow-up Question
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFollowUp()}
                    placeholder="Ask a follow-up question about this comparison..."
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={followUpLoading}
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={followUpLoading || !followUpQuery.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {followUpLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {followUpAnswer && (
                  <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {followUpAnswer}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setTopic1("");
                  setTopic2("");
                  setFollowUpAnswer("");
                  setFollowUpQuery("");
                }}
                className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg font-semibold transition-all"
              >
                Start New Comparison
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
