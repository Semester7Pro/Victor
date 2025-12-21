"use client";

import { useEffect, useRef } from "react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import {
  Search,
  MessageSquare,
  UploadCloud,
  ChevronRight,
} from "lucide-react";

export default function HeroSection() {
  const { user } = useUser();
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!sectionRef.current || reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-animate",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power3.out",
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#EFEDEC] rounded-b-[74px]"
    >
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="hero-animate inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-neutral-200 shadow-sm mb-10">
          <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-neutral-600">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="w-2 h-2 rounded-full bg-white border" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            भारत RAG
          </span>
        </div>

        {/* Headline */}
        <h1 className="hero-animate font-serif text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] text-neutral-900 mb-6">
          Navigate{" "}
          <span className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
            Complexity
          </span>
          .
        </h1>

        {/* Subheading */}
        <h2 className="hero-animate text-lg md:text-2xl font-medium text-neutral-700 mb-8">
          Precision Retrieval.{" "}
          <span className="text-neutral-500">
            Verified Reasoning.
          </span>
        </h2>

        {/* Description */}
        <p className="hero-animate max-w-2xl mx-auto text-base md:text-lg text-neutral-600 mb-14 leading-relaxed">
          Transform fragmented regulatory documents into a unified
          intelligence system with traceable sources, structured memory,
          and auditable answers.
        </p>

        {/* CTAs */}
        <div className="hero-animate flex flex-wrap justify-center gap-4">
          {user ? (
            <>
              <Link
                href="/chat"
                className="h-12 px-8 rounded-xl bg-neutral-900 text-white font-semibold flex items-center gap-2 shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition"
              >
                <MessageSquare className="w-4 h-4" />
                Start Analysis
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/search"
                className="h-12 px-6 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur text-neutral-700 font-medium hover:bg-white transition flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              <Link
                href="/upload"
                className="h-12 px-6 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur text-neutral-700 font-medium hover:bg-white transition flex items-center"
              >
                <UploadCloud className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="h-12 px-10 rounded-xl bg-neutral-900 text-white font-semibold shadow-lg hover:shadow-xl transition">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="h-12 px-10 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur text-neutral-700 font-medium hover:bg-white transition">
                  Create Account
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
