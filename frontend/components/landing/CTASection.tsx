"use client";

import React from "react";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <section className="relative bg-white py-28 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Paper Card */}
        <div className="relative rounded-3xl bg-[#F6F4F1] border border-neutral-200 px-8 py-16 md:px-16 md:py-20 text-center">
          {/* Heading */}
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mb-6">
            Turn documents into
            <br className="hidden md:block" />
            <span className="text-neutral-600"> verifiable intelligence</span>
          </h2>

          {/* Supporting copy */}
          <p className="mx-auto max-w-2xl text-neutral-600 text-base md:text-lg leading-relaxed mb-12">
            Upload policies, circulars, and reports.  
            Ask complex questions.  
            Receive precise answers grounded in traceable sources.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  href="/upload"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-neutral-900 text-white font-semibold shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition"
                >
                  Upload Documents
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/search"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-neutral-300 bg-white text-neutral-700 font-medium hover:bg-neutral-100 transition"
                >
                  Search Knowledge Base
                </Link>
              </>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-neutral-900 text-white font-semibold shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignUpButton>

                <SignInButton mode="modal">
                  <button className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-neutral-300 bg-white text-neutral-700 font-medium hover:bg-neutral-100 transition">
                    Sign In
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
