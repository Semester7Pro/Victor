'use client';

import { useState, useEffect } from 'react';
import { X, Database, Trash2, Info, FileText, BarChart } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Collection {
  name: string;
  num_entities: number;
  description: string;
}

interface MilvusManagerProps {
  authToken: string;
  onClose: () => void;
}

export default function MilvusManager({ authToken, onClose }: MilvusManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'schema' | 'stats' | 'sample'>('list');
  const [detailData, setDetailData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/milvus/collections`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load collections');
      }

      const data = await response.json();
      setCollections(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async (collectionName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/milvus/collections/${collectionName}/schema`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load schema');
      const data = await response.json();
      setDetailData(data);
      setViewMode('schema');
      setSelectedCollection(collectionName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (collectionName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/milvus/collections/${collectionName}/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setDetailData(data);
      setViewMode('stats');
      setSelectedCollection(collectionName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async (collectionName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/milvus/collections/${collectionName}/sample?limit=5`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load sample data');
      const data = await response.json();
      setDetailData(data);
      setViewMode('sample');
      setSelectedCollection(collectionName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionName: string) => {
    if (!confirm(`Are you sure you want to delete collection "${collectionName}"? This cannot be undone!`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/milvus/collections/${collectionName}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collection_name: collectionName, confirm: true }),
      });

      if (!response.ok) throw new Error('Failed to delete collection');
      
      alert(`Collection "${collectionName}" deleted successfully`);
      loadCollections();
      setViewMode('list');
      setSelectedCollection(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0118] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Milvus Database Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">
                Collections ({collections.length})
              </h3>
              {collections.map((collection) => (
                <div
                  key={collection.name}
                  className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-500/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{collection.name}</h4>
                    <span className="text-sm text-purple-300">
                      {collection.num_entities.toLocaleString()} entities
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{collection.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadSchema(collection.name)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-sm text-blue-300 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Schema
                    </button>
                    <button
                      onClick={() => loadStats(collection.name)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-sm text-green-300 transition-colors"
                    >
                      <BarChart className="w-4 h-4" />
                      Stats
                    </button>
                    <button
                      onClick={() => loadSample(collection.name)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-sm text-yellow-300 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                      Sample
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.name)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-sm text-red-300 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  setViewMode('list');
                  setSelectedCollection(null);
                  setDetailData(null);
                }}
                className="mb-4 text-purple-400 hover:text-purple-300 text-sm"
              >
                ← Back to collections
              </button>

              {viewMode === 'schema' && detailData && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">{detailData.collection_name} - Schema</h3>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Fields:</h4>
                    {detailData.fields.map((field: any, idx: number) => (
                      <div key={idx} className="mb-3 p-3 bg-black/30 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-purple-300 font-mono">{field.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">{field.type}</span>
                          {field.is_primary && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">PRIMARY</span>
                          )}
                        </div>
                        {Object.keys(field.params).length > 0 && (
                          <pre className="text-xs text-gray-400 mt-1">{JSON.stringify(field.params, null, 2)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                  {detailData.indexes.length > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Indexes:</h4>
                      {detailData.indexes.map((idx: any, i: number) => (
                        <div key={i} className="mb-2 p-3 bg-black/30 rounded">
                          <div className="text-purple-300">Field: {idx.field_name}</div>
                          <div className="text-sm text-gray-400">Type: {idx.index_type}</div>
                          <div className="text-sm text-gray-400">Metric: {idx.metric_type}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'stats' && detailData && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">{detailData.collection_name} - Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Total Entities</div>
                      <div className="text-2xl font-bold text-white">{detailData.num_entities.toLocaleString()}</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="text-2xl font-bold text-white">
                        {detailData.is_loaded ? '✅ Loaded' : '⏸️ Not Loaded'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Description</div>
                    <div className="text-white">{detailData.description}</div>
                  </div>
                </div>
              )}

              {viewMode === 'sample' && detailData && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Sample Data ({detailData.count} items)</h3>
                  <div className="space-y-3">
                    {detailData.samples.map((sample: any, idx: number) => (
                      <div key={idx} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="text-sm text-purple-300 mb-2">Sample {idx + 1}</div>
                        <pre className="text-xs text-gray-300 overflow-auto max-h-48">
                          {JSON.stringify(sample, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-500/20 bg-purple-500/5">
          <button
            onClick={loadCollections}
            className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-colors"
          >
            Refresh Collections
          </button>
        </div>
      </div>
    </div>
  );
}