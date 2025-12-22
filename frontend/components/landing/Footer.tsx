import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-32 bg-[#F6F4F1]">
      {/* subtle divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160px] h-px bg-neutral-300" />

      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand & philosophy */}
          <div className="md:col-span-5">
            <h3 className="font-serif text-2xl text-neutral-900 tracking-tight mb-4">
              Victor
            </h3>
            <p className="max-w-md text-neutral-600 leading-relaxed text-sm">
              Victor is an AI-powered retrieval system designed to navigate
              complex regulatory, legal, and policy documents with clarity,
              traceability, and institutional trust.
            </p>

            <p className="mt-6 text-xs uppercase tracking-widest text-neutral-500">
              Built for governance · Designed for reasoning
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">
                Product
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <Link href="#features" className="hover:text-neutral-900 transition">
                    How Victor Works
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="hover:text-neutral-900 transition">
                    Semantic Search
                  </Link>
                </li>
                <li>
                  <Link href="/upload" className="hover:text-neutral-900 transition">
                    Document Ingestion
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-neutral-900 transition">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">
                Organization
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <Link href="/about" className="hover:text-neutral-900 transition">
                    About Victor
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-neutral-900 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-neutral-900 transition">
                    Security & Trust
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">
                Legal
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <Link href="/privacy" className="hover:text-neutral-900 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-neutral-900 transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-neutral-900 transition">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="pt-8 border-t border-neutral-300 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <span>© 2025 Victor. All rights reserved.</span>
          <span>
            Powered by <span className="text-neutral-700">Milvus</span> ·{" "}
            <span className="text-neutral-700">OpenRouter</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
