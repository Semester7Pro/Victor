"use client";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UploadSection() {
    const { user, isLoaded } = useUser();
  
  return (
    <section className="py-20 px-4 border-t border-neutral-800 bg-black">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                      <h2 className="text-4xl font-bold mb-6 text-white">
                        Upload Your Documents
                      </h2>
                      <p className="text-neutral-300 text-lg mb-8">
                        Start by uploading your PDF documents. Victor will
                        automatically process and index them, making them instantly
                        searchable with AI-powered queries.
                      </p>
                      <div className="space-y-4">
                        {[
                          {
                            title: "Multiple Formats",
                            desc: "Support for PDF and document formats",
                          },
                          {
                            title: "Instant Indexing",
                            desc: "Fast processing with vector embeddings",
                          },
                          {
                            title: "Secure Storage",
                            desc: "Your documents are encrypted and safe",
                          },
                        ].map(({ title, desc }) => (
                          <div className="flex gap-3" key={title}>
                            <span className="text-white text-2xl">•</span>
                            <div>
                              <h4 className="text-lg font-semibold mb-1 text-white">
                                {title}
                              </h4>
                              <p className="text-neutral-400 text-sm">{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
    
                      {user ? (
                        <Link
                          href="/upload"
                          className="inline-flex items-center justify-center mt-8 px-10 py-4 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                        >
                          Upload Documents Now
                        </Link>
                      ) : (
                        <SignInButton mode="modal">
                          <button className="inline-flex items-center justify-center mt-8 px-10 py-4 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium transition-colors">
                            Sign In to Upload
                          </button>
                        </SignInButton>
                      )}
                    </div>
    
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-12 text-center">
                      <div className="text-4xl mb-4 text-white">📄</div>
                      <h3 className="text-2xl font-bold mb-4 text-white">
                        Upload & Index
                      </h3>
                      <p className="text-neutral-300 mb-8">
                        Drag and drop your documents or click to browse
                      </p>
                      <div className="bg-black rounded border-2 border-dashed border-neutral-600 p-8">
                        <p className="text-neutral-400">
                          PDF files, Word documents, and more
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
  );
}