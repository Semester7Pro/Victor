import React from "react";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white rounded-b-[74px]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
            About Victor
          </h2>
          <p className="text-neutral-600 text-base md:text-lg">
            An intelligence system built for governance, clarity, and trust.
          </p>
        </div>

        {/* Content Card */}
        <div className="max-w-4xl mx-auto bg-white border border-neutral-200 rounded-2xl p-10 md:p-12 transition-all duration-300 hover:border-neutral-300">
          <p className="text-neutral-700 leading-relaxed text-base md:text-lg">
            Victor is an AI-powered information retrieval system designed to
            navigate the complexity of government regulations, policies, and
            public schemes.
            <br />
            <br />
            It transforms fragmented and unstructured documents into a unified,
            queryable knowledge base - enabling decision-makers to access
            precise, context-aware answers backed by verifiable sources.
            <br />
            <br />
            By combining advanced retrieval techniques with structured reasoning,
            Victor supports faster analysis, greater transparency, and
            data-driven governance at scale.
          </p>
        </div>
      </div>
    </section>
  );
}
