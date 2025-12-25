"use client";

import { useState, useEffect } from "react";
import {
  LayersIcon,
  GlobeIcon,
  LockClosedIcon,
  FileTextIcon,
  MixIcon,
  CodeIcon,
  InputIcon,
  ChatBubbleIcon,
  DesktopIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

const features = [
  {
    Icon: LayersIcon,
    name: "Semantic Chunking",
    headline: "Intelligent Document Segmentation",
    description:
      "Break down complex documents into meaningful, context-aware segments that preserve semantic relationships and improve retrieval accuracy.",
    cta: "Explore Chunking",
  },
  {
    Icon: GlobeIcon,
    name: "Multilingual Support",
    headline: "Global Knowledge Access",
    description:
      "Seamlessly query and retrieve information across multiple languages with native understanding, ensuring no context is lost in translation.",
    cta: "View Languages",
  },
  {
    Icon: LockClosedIcon,
    name: "Role-Based Access Control",
    headline: "Enterprise-Grade Security",
    description:
      "Granular permission management ensures users only access authorized content, maintaining compliance and data governance at scale.",
    cta: "Learn Security",
  },
  {
    Icon: FileTextIcon,
    name: "Multimodal Chunking",
    headline: "Beyond Text Processing",
    description:
      "Extract and index information from text, images, tables, and charts with unified multimodal understanding for comprehensive retrieval.",
    cta: "See Examples",
  },
  {
    Icon: MixIcon,
    name: "Hybrid Retrieval",
    headline: "Best of Both Worlds",
    description:
      "Combine dense semantic embeddings with sparse BM25 lexical matching for superior accuracy across diverse query patterns.",
    cta: "View Architecture",
  },
  {
    Icon: CodeIcon,
    name: "LangChain Orchestration",
    headline: "Flexible AI Pipelines",
    description:
      "Build and customize RAG workflows with industry-standard LangChain components for maximum extensibility and control.",
    cta: "Read Docs",
  },
  {
    Icon: InputIcon,
    name: "Evaluation Models",
    headline: "Continuous Quality Assurance",
    description:
      "Compare retrieval strategies and model outputs with built-in evaluation frameworks to optimize performance metrics.",
    cta: "Run Benchmarks",
  },
  {
    Icon: ChatBubbleIcon,
    name: "Collaborative Interface",
    headline: "Team Research Hub",
    description:
      "Share insights, annotate sources, and collaborate in real-time with an intuitive chat-based research environment.",
    cta: "Start Collaborating",
  },
  {
    Icon: DesktopIcon,
    name: "Offline Inference",
    headline: "Local-First AI with Ollama",
    description:
      "Run powerful language models entirely on your infrastructure with Ollama integration for air-gapped environments and data sovereignty.",
    cta: "Deploy Locally",
  },
];

export default function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(3);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentFeature = features[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      handleNext();
    }
    if (touchStart - touchEnd < -75) {
      handlePrev();
    }
  };

  const getIconStyle = (index: number) => {
    const totalIcons = features.length;

    let relativeIndex = index - activeIndex;
    if (relativeIndex < -totalIcons / 2) relativeIndex += totalIcons;
    if (relativeIndex > totalIcons / 2) relativeIndex -= totalIcons;

    const radius = 350;
    const angleRange = 180;
    const anglePerIcon = angleRange / (totalIcons - 1);
    const angle = relativeIndex * anglePerIcon;
    const rad = angle * (Math.PI / 180);

    const x = -Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    let opacity = 1;
    const absIndex = Math.abs(relativeIndex);

    if (absIndex > 4) {
      opacity = 0;
    } else if (absIndex > 3) {
      opacity = 0.25;
    } else if (absIndex > 2) {
      opacity = 0.45;
    } else if (absIndex > 1) {
      opacity = 0.7;
    }

    const scale = index === activeIndex ? 1.25 : absIndex > 2 ? 0.75 : 0.9;

    return {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      opacity,
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: opacity > 0.3 ? "auto" : "none",
    };
  };

  if (isMobile) {
    return (
      <section
        id="features"
        className="relative w-full bg-[#F6F4F1] py-16 px-4 rounded-t-[40px] rounded-b-[40px] overflow-hidden"
      >
        <div className="mx-auto max-w-3xl">
          {/* Mobile Heading */}
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
              How Victor
              <br />
              stands out
            </h2>
            <div className="w-12 h-0.5 bg-neutral-800 mx-auto mt-6" />
          </div>

          {/* Mobile Swipeable Card Carousel */}
          <div className="relative">
            {/* Main Feature Card */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative"
            >
              <div
                key={activeIndex}
                className="bg-white rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in touch-pan-y"
              >
                {/* Icon Badge */}
                <div className="inline-flex items-center gap-3 px-4 py-3 bg-neutral-900 rounded-2xl shadow-lg">
                  <currentFeature.Icon className="w-6 h-6 text-white" />
                  <span className="text-sm font-semibold text-white">
                    {currentFeature.name}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
                    {currentFeature.headline}
                  </h3>
                  <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                    {currentFeature.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-neutral-900 hover:text-white group"
                aria-label="Previous feature"
              >
                <ChevronLeftIcon className="w-6 h-6 text-neutral-900 group-hover:text-white" />
              </button>

              {/* Progress Dots */}
              <div className="flex gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "bg-neutral-900 w-8"
                        : "bg-neutral-300 w-2"
                    }`}
                    aria-label={`Go to feature ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-neutral-900 hover:text-white group"
                aria-label="Next feature"
              >
                <ChevronRightIcon className="w-6 h-6 text-neutral-900 group-hover:text-white" />
              </button>
            </div>

            {/* Feature Icons Grid Below */}
            {/* <div className="mt-12 grid grid-cols-3 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.Icon;
                const isActive = index === activeIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`relative p-4 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-neutral-900 shadow-lg scale-105"
                        : "bg-white shadow-md hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 mx-auto ${
                        isActive ? "text-white" : "text-neutral-600"
                      }`}
                    />
                    <p
                      className={`mt-2 text-xs font-medium text-center ${
                        isActive ? "text-white" : "text-neutral-600"
                      }`}
                    >
                      {feature.name}
                    </p>
                  </button>
                );
              })}
            </div> */}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="features"
      className="relative w-full min-h-screen bg-[#F6F4F1] py-20 px-6 rounded-t-[74px] rounded-b-[74px] overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] h-full relative">
        <div className="flex items-center justify-start min-h-[600px] gap-[120px]">
          {/* Left side - Heading */}
          <div className="w-[380px] shrink-0">
            <h2 className="font-serif text-[72px] font-bold tracking-tight text-neutral-900 leading-[0.95]">
              How Victor
              <br />
              stands out
            </h2>
            <div className="w-16 h-[3px] bg-neutral-800 mt-10" />
          </div>

          {/* Center/Right - Feature card with fade effect */}
          <div className="flex-1 max-w-[1000px] relative">
            <div
              key={activeIndex}
              className="relative bg-white rounded-[32px] p-14 shadow-2xl space-y-8 animate-fade-in overflow-hidden"
              style={{
                background:
                  "linear-gradient(to right, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 60%, rgba(246, 244, 241, 0.6) 90%, rgba(246, 244, 241, 0) 100%)",
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Fade overlay on the right edge */}
              <div
                className="absolute top-0 right-0 w-[200px] h-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, transparent 0%, rgba(246, 244, 241, 0.3) 50%, rgba(246, 244, 241, 0.9) 100%)",
                }}
              />

              <div className="inline-block relative z-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-sm font-medium text-neutral-700">
                  <currentFeature.Icon className="w-4 h-4" />
                  {currentFeature.name}
                </span>
              </div>

              <div className="space-y-6 relative z-10">
                <h3 className="font-serif text-[52px] font-bold text-neutral-900 leading-[1.1] max-w-[500px]">
                  {currentFeature.headline}
                </h3>
                <p className="text-neutral-600 text-[17px] leading-relaxed max-w-[500px]">
                  {currentFeature.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Circular arc of icons - positioned to overlap the card from the right */}
        <div
          className="absolute right-[0.75%] top-1/2 w-[1120px] h-[1000px] pointer-events-none"
          style={{ transform: "translateY(-50%)" }}
        >
          <div className="relative w-full h-full">
            {/* Curved line path - aligned with icon arc */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 600 800"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              style={{ top: "-50px", position: "absolute" }}
            >
              <defs>
                <linearGradient id="arcGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor="rgba(15,23,42,0.12)" />
                  <stop offset="100%" stopColor="rgba(15,23,42,0.04)" />
                </linearGradient>
              </defs>

              <path
                d="M 700 0 A 300 300 0 1 0 1000 50"
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 10"
                opacity="0.9"
                className="text-neutral-400"
                transform="translate(10, 180)"
              />
            </svg>

            {/* Icons positioned along the circular arc */}
            <div className="absolute -right-[30px] top-1/2 -translate-y-1/2 pointer-events-auto">
              {features.map((feature, index) => {
                const Icon = feature.Icon;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    style={getIconStyle(index) as any}
                    className={`absolute w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-2xl"
                        : "bg-white text-neutral-600 shadow-md hover:shadow-lg hover:bg-neutral-50"
                    }`}
                    aria-label={feature.name}
                  >
                    <Icon className={isActive ? "w-10 h-10" : "w-5 h-5"} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </section>
  );
}