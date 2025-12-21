"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, CheckCircle, Loader2, Sun, Moon, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MultiStepLoader } from "@/components/ui/MultiStepLoader";

const PIPELINE_STEPS = [
  { text: "Uploaded", description: "File received" },
  { text: "Parsing document", description: "Extracting content" },
  { text: "Chunking content", description: "Splitting into sections" },
  { text: "Generating embeddings", description: "Generating vectors" },
  { text: "Indexing in search", description: "Building search index" },
  { text: "Ready to query", description: "Available for queries" }
];

interface DocumentInfo {
  document_id: string;
  version: number;
  status: string;
  progress_step?: number;
  ready?: boolean;
  filename?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<Map<string, DocumentInfo>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [isDragging, setIsDragging] = useState(false);

  // 🔁 Poll pipeline status for all documents
  useEffect(() => {
    if (documents.size === 0) return;

    const intervals: NodeJS.Timeout[] = [];
    let redirectScheduled = false;

    documents.forEach((docInfo, docId) => {
      // Skip if already ready
      if (docInfo.ready) return;

      const interval = setInterval(async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/api/upload/${docId}/status?version=${docInfo.version}`
          );
          
          if (!res.ok) {
            console.error(`Status check failed for ${docId}`);
            return;
          }

          const data = await res.json();
          
          setDocuments(prev => {
            const updated = new Map(prev);
            const current = updated.get(docId);
            if (current) {
              updated.set(docId, {
                ...current,
                progress_step: data.progress_step ?? 0,
                ready: data.ready ?? false,
                status: data.stage || current.status
              });
            }
            
            // Check if all documents are ready
            const allReady = Array.from(updated.values()).every(doc => doc.ready);
            if (allReady && updated.size > 0 && !redirectScheduled) {
              redirectScheduled = true;
              setTimeout(() => {
                router.push("/chat");
              }, 2000);
            }
            
            return updated;
          });
        } catch (e) {
          console.error(`Status polling failed for ${docId}:`, e);
        }
      }, 2000);

      intervals.push(interval);
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [documents, router]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage("");
    setDocuments(new Map());
    setUploadProgress(new Map());

    const fileArray = Array.from(files);
    let successCount = 0;
    let failCount = 0;

    // Upload all files concurrently
    const uploadPromises = fileArray.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("org_id", "TEMP_ORG");
      formData.append("uploader_id", "TEMP_USER");
      formData.append("category", "uploads");

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const updated = new Map(prev);
            const current = updated.get(file.name) || 0;
            if (current < 90) {
              updated.set(file.name, current + 10);
            }
            return updated;
          });
        }, 200);

        const res = await fetch("http://localhost:8000/api/upload/", {
          method: "POST",
          body: formData
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await res.json();
        
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.set(file.name, 100);
          return updated;
        });
        
        setDocuments(prev => {
          const updated = new Map(prev);
          updated.set(data.document_id, {
            document_id: data.document_id,
            version: data.version,
            status: data.status,
            progress_step: 0,
            ready: false,
            filename: file.name
          });
          return updated;
        });

        successCount++;
        return { success: true, file: file.name, data };
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        failCount++;
        return { success: false, file: file.name, error: err };
      }
    });

    await Promise.all(uploadPromises);

    setUploading(false);
    
    if (successCount > 0) {
      setMessage(
        `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}. ` +
        (failCount > 0 ? `${failCount} failed.` : "Processing started.")
      );
    } else {
      setMessage("All uploads failed. Please try again.");
    }
  }, []);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeDocument = (docId: string) => {
    setDocuments(prev => {
      const updated = new Map(prev);
      updated.delete(docId);
      return updated;
    });
  };

  const allReady = Array.from(documents.values()).every(doc => doc.ready);
  const documentsArray = Array.from(documents.entries());

  // Sync dark mode with HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Tricolor Top Bar */}
      <div className="h-1.5 w-full tricolor-bar" />

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[hsl(var(--saffron))]/20 to-[hsl(var(--gov-green))]/20">
                <span className="text-lg font-bold bg-gradient-to-r from-[hsl(var(--saffron))] to-[hsl(var(--gov-green))] bg-clip-text text-transparent">V</span>
              </div>
              <span className="font-semibold text-lg text-foreground">Victor</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl transition-all bg-muted hover:bg-muted/80"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Upload Documents
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Upload one or multiple PDF documents. Victor will parse, understand, and index them automatically.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-[hsl(var(--saffron))] bg-[hsl(var(--saffron))]/10' 
              : 'border-border hover:border-muted-foreground bg-card'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
            id="file-upload"
          />
          
          <div className="p-12 text-center">
            <motion.div
              animate={{ 
                scale: isDragging ? 1.1 : 1,
                rotate: isDragging ? 5 : 0
              }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[hsl(var(--saffron))]/20 to-[hsl(var(--gov-green))]/20"
            >
              <Upload className="w-10 h-10 text-[hsl(var(--saffron))]" />
            </motion.div>
            
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </h3>
            <p className="mb-2 text-muted-foreground">
              or <label htmlFor="file-upload" className="text-[hsl(var(--saffron))] font-medium cursor-pointer hover:underline">browse</label> to select files
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF files only
            </p>
          </div>

          {/* Upload Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 pb-6"
              >
                <div className={`py-3 px-4 rounded-xl text-center font-medium ${
                  message.includes('Success') 
                    ? 'bg-[hsl(var(--gov-green))]/10 text-[hsl(var(--gov-green))]' 
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Processing Documents */}
        <AnimatePresence>
          {documentsArray.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 space-y-6"
            >
              {documentsArray.map(([docId, doc], index) => {
                const currentStep = doc.progress_step ?? 0;
                
                return (
                  <motion.div
                    key={docId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl overflow-hidden bg-card border border-border shadow-lg"
                  >
                    {/* Document Header */}
                    <div className="p-5 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {doc.filename || docId}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              v{doc.version} • {doc.status}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {doc.ready ? (
                            <span className="flex items-center gap-1.5 text-[hsl(var(--gov-green))] font-medium text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[hsl(var(--saffron))] font-medium text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing
                            </span>
                          )}
                          <button
                            onClick={() => removeDocument(docId)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-muted text-muted-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Multi-Step Loader */}
                    <div className="p-6">
                      <MultiStepLoader
                        loadingStates={PIPELINE_STEPS}
                        loading={true}
                        value={currentStep}
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* All Ready Banner */}
              <AnimatePresence>
                {allReady && documentsArray.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl bg-gradient-to-r from-[hsl(var(--saffron))]/10 via-card/10 to-[hsl(var(--gov-green))]/10 border border-[hsl(var(--gov-green))]/30 p-6 text-center"
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <CheckCircle className="w-6 h-6 text-[hsl(var(--gov-green))]" />
                      <span className="text-lg font-semibold text-foreground">
                        All documents ready!
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Redirecting to chat in 2 seconds...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
