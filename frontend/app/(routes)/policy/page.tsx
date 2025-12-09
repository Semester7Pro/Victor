"use client";

import { LeftPanel } from "@/components/panels/LeftPanel";
import { CenterPanel } from "@/components/panels/CenterPanel";
import { RightPanel } from "@/components/panels/RightPanel";
import Link from "next/link";
import { Home } from "lucide-react";

export default function PolicyDrafterPage() {
  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-400 hover:text-white transition">
            <Home className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              Policy Assist Drafter
            </h1>
            <p className="text-xs text-neutral-400">Ministry of Education</p>
          </div>
        </div>
        <div className="text-xs text-neutral-500">
          Draft ID: EDU-2024-0847
        </div>
      </header>

      {/* Main Content - Three Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 border-r border-neutral-800 flex flex-col">
          <LeftPanel />
        </div>

        {/* Center Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <CenterPanel />
        </div>

        {/* Right Panel */}
        <div className="w-96 border-l border-neutral-800 flex flex-col">
          <RightPanel />
        </div>
      </main>
    </div>
  );
}