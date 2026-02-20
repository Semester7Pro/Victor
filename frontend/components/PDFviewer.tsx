// components/PDFViewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  fileUrl: string;
  page: number;
  highlightText?: string;
  bbox?: number[]; // [x0, y0, x1, y1] from MinerU
}

interface HighlightBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function PDFViewer({ fileUrl, page, highlightText, bbox }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfInfo, setPdfInfo] = useState<{ currentPage: number; totalPages: number } | null>(null);
  const [highlight, setHighlight] = useState<HighlightBox | null>(null);
  const [scale] = useState(1.5);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (renderTaskRef.current?.cancel) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }
    };
  }, []);

  // Scroll to viewer on mount
  useEffect(() => {
    if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setLoading(true);
      setError(null);
      setHighlight(null);

      // Cancel previous render
      if (renderTaskRef.current?.cancel) {
        try { 
          renderTaskRef.current.cancel(); 
        } catch {}
        renderTaskRef.current = null;
      }

      try {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`📄 Loading PDF: ${fileUrl.substring(fileUrl.lastIndexOf('/') + 1)}`);
        console.log(`📍 Page: ${page}`);
        console.log(`📦 BBox from MinerU: ${bbox ? `[${bbox.join(', ')}]` : 'None'}`);
        
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        if (!mountedRef.current || cancelled) return;

        // Use exact page number (already 1-indexed)
        const targetPage = Math.max(1, Math.min(Number(page) || 1, pdf.numPages));
        
        console.log(`📚 PDF has ${pdf.numPages} pages, rendering page ${targetPage}`);

        const pdfPage = await pdf.getPage(targetPage);
        if (!mountedRef.current || cancelled) return;

        const viewport = pdfPage.getViewport({ scale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        console.log(`🎨 Rendering page ${targetPage}...`);
        const rt = pdfPage.render({ canvasContext: ctx, canvas,viewport });
        renderTaskRef.current = rt;
        await rt.promise;
        renderTaskRef.current = null;
        
        console.log(`✅ Page ${targetPage} rendered successfully`);

        // Convert MinerU bbox to viewport coordinates
        if (bbox && Array.isArray(bbox) && bbox.length === 4) {
          const [x0, y0, x1, y1] = bbox;
          
          console.log(`📐 Converting MinerU bbox to viewport coordinates...`);
          console.log(`   Original bbox (PDF coords): [${x0}, ${y0}, ${x1}, ${y1}]`);
          
          // MinerU bbox is in PDF coordinates: [x0, y0, x1, y1]
          // where (x0, y0) is bottom-left and (x1, y1) is top-right
          // PDF.js uses bottom-left origin, but canvas uses top-left
          
          // Get page dimensions
          const pageHeight = pdfPage.view[3];
          
          // Convert PDF coordinates to viewport coordinates
          // Note: PDF y-axis goes bottom-to-top, so we need to flip it
          const [vx0, vy0] = viewport.convertToViewportPoint(x0, pageHeight - y1);
          const [vx1, vy1] = viewport.convertToViewportPoint(x1, pageHeight - y0);
          
          const highlightBox: HighlightBox = {
            left: vx0,
            top: vy0,
            width: vx1 - vx0,
            height: vy1 - vy0,
          };
          
          console.log(`   Viewport coords: left=${highlightBox.left.toFixed(1)}, top=${highlightBox.top.toFixed(1)}, width=${highlightBox.width.toFixed(1)}, height=${highlightBox.height.toFixed(1)}`);
          console.log(`✅ Highlight box created`);
          
          setHighlight(highlightBox);
        } else {
          console.log(`⚠️ No valid bbox provided for highlighting`);
        }

        setPdfInfo({ 
          currentPage: targetPage, 
          totalPages: pdf.numPages
        });
        
        if (mountedRef.current) {
          setLoading(false);
        }
        
        console.log(`${"=".repeat(80)}\n`);
      } catch (err: any) {
        const msg = err?.message || "";
        if (!msg.includes("cancel") && !msg.includes("aborted")) {
          console.error("❌ PDF render error:", err);
          if (mountedRef.current) {
            setError(`Failed to load PDF: ${msg}`);
            setLoading(false);
          }
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current?.cancel) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [fileUrl, page, bbox, scale]);

  return (
    <div ref={containerRef} className="relative space-y-4">
      {/* PDF Info Banner */}
      {pdfInfo && (
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-2">
            {/* <span className="text-blue-700 font-medium">
              📄 Page {pdfInfo.currentPage} of {pdfInfo.totalPages}
            </span> */}
            {bbox && (
              <span className="text-xs text-blue-600">
                📍 Using MinerU coordinates
              </span>
            )}
          </div>
          {loading && (
            <span className="text-blue-600 text-xs animate-pulse">Loading...</span>
          )}
          {highlight && !loading && (
            <span className="text-green-600 text-xs font-medium flex items-center gap-1">
              ✨ Highlighted
            </span>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* PDF Canvas with Highlights */}
      <div className="relative bg-gray-50 rounded-lg p-4 flex justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Loading page {page}...</p>
            </div>
          </div>
        )}
        
        <div className="relative inline-block">
          <canvas 
            ref={canvasRef} 
            className="rounded border border-gray-300 shadow-lg max-w-full" 
            style={{ display: loading ? 'none' : 'block' }}
          />
          
          {/* Highlight Overlay using MinerU bbox */}
          {!loading && highlight && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute rounded-sm"
                style={{
                  left: `${highlight.left}px`,
                  top: `${highlight.top}px`,
                  width: `${highlight.width}px`,
                  height: `${highlight.height}px`,
                  backgroundColor: 'rgba(252, 211, 77, 0.35)',
                  border: '2px solid rgba(251, 191, 36, 0.7)',
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.4), inset 0 0 8px rgba(252, 211, 77, 0.2)',
                  animation: 'highlightPulse 2s ease-in-out infinite',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Highlighted Text Display */}
      {highlightText && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-yellow-900 text-sm font-bold">📌</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Referenced Text from Page {pdfInfo?.currentPage || page}
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">
                "{highlightText}"
              </p>
              {bbox && (
                <p className="text-[10px] text-gray-500 mt-2 font-mono">
                  BBox: [{bbox.join(', ')}]
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes highlightPulse {
          0%, 100% {
            opacity: 1;
            background-color: rgba(252, 211, 77, 0.35);
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            background-color: rgba(252, 211, 77, 0.5);
            transform: scale(1.01);
          }
        }
      `}</style>
    </div>
  );
}