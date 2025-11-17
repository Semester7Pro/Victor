"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔥 Main Upload Handler
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📂 Selected file:", file);

    setUploading(true);
    setMessage("");

    // ----------------------------------------------------------------------
    // 1️⃣ Upload to Supabase Storage
    // ----------------------------------------------------------------------
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log("⬆️ Uploading to Supabase at path:", filePath);

    const { data, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    console.log("📦 Supabase upload result:", data);

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError);
      setMessage("❌ Upload failed.");
      setUploading(false);
      return;
    }

    console.log("✅ File uploaded successfully!");

    // ----------------------------------------------------------------------
    // 2️⃣ Notify Backend (FastAPI)
    // ----------------------------------------------------------------------
    const payload = {
      file_path: filePath,
      filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      org_id: "TEMP_ORG", // replace later when auth added
      uploader_id: "TEMP_USER",
    };

    console.log("📨 Sending payload to backend /upload-callback:", payload);

    const response = await fetch("http://localhost:8000/api/upload/upload-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("🔎 Backend response status:", response.status);

    if (!response.ok) {
      const respText = await response.text();
      console.error("❌ Backend error:", respText);
      setMessage("❌ Server rejected the upload metadata.");
      setUploading(false);
      return;
    }

    console.log("🎉 Backend accepted the file!");

    setMessage("✅ Upload successful! Processing will start shortly.");
    setUploading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white bg-opacity-80 backdrop-blur-md shadow-sm">
        <Link
          href="/"
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Victor
        </Link>
        <Link
          href="/"
          className="text-gray-600 hover:text-blue-600 transition font-semibold"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Section */}
      <section className="max-w-2xl mx-auto px-8 py-24">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Upload Your Document
            </h1>
            <p className="text-xl text-gray-600">
              Let Victor analyze and process your files with AI-powered intelligence.
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-xl p-12 space-y-8">
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition">
              <input
                type="file"
                onChange={handleUpload}
                className="cursor-pointer"
              />

              {uploading && <p className="mt-3 text-blue-600">Uploading...</p>}
              {message && (
                <p className="mt-3 text-green-600 font-semibold">{message}</p>
              )}
            </div>

            {/* Supported formats */}
            <div className="bg-blue-50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Supported Formats:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <p className="text-sm text-gray-600">PDF</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm text-gray-600">DOC / DOCX</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm text-gray-600">TXT</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">What Happens Next?</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Your file is uploaded safely.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Your server begins processing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>You get insights after processing is complete.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p>&copy; 2024 Victor. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
