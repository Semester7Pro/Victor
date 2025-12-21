import {
  BellIcon,
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  InputIcon,
} from "@radix-ui/react-icons"

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import DocumentIngestionBG from "../visuals/DocumentIngestionBG";
import SemanticRetrievalBG from "../visuals/SemanticRetrievalBG";
import MultilingualBG from "../visuals/MultilingualBG";
import TemporalContextBG from "../visuals/MultilingualBG";
import TraceabilityBG from "../visuals/TraceabilityBG";


const features = [
  {
    Icon: FileTextIcon,
    name: "Document Ingestion",
    description:
      "Ingest large regulatory documents, circulars, policies, and reports in their original structure.",
    href: "/",
    cta: "Learn more",
    background: <DocumentIngestionBG />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: InputIcon,
    name: "Semantic Retrieval",
    description:
      "Retrieve context-aware answers using meaning, not keywords.",
    href: "/",
    cta: "Learn more",
    background: <SemanticRetrievalBG />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: GlobeIcon,
    name: "Multilingual Understanding",
    description:
      "Understand information across languages without losing intent.",
    href: "/",
    cta: "Learn more",
    background: <MultilingualBG />,
    className: "lg:col-start-1 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: CalendarIcon,
    name: "Temporal Context",
    description:
      "Account for amendments and validity periods.",
    href: "/",
    cta: "Learn more",
    background: <TemporalContextBG />,
    className: "lg:col-start-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BellIcon,
    name: "Traceable Answers",
    description:
      "Every answer is backed by verifiable sources.",
    href: "/",
    cta: "Learn more",
    background: <TraceabilityBG />,
    className: "lg:col-start-3 lg:row-start-2 lg:row-end-4",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full min-h-screen bg-[#F6F4F1] py-20 px-6 rounded-t-[74px] rounded-b-[74px]"
    >
      <div className="mx-auto max-w-7xl h-full flex flex-col">
        {/* Section header */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
            How Victor Works
          </h2>
          <p className="text-neutral-600 text-base md:text-lg">
            A retrieval system designed for clarity, traceability, and scale.
          </p>
        </div>

        {/* Bento grid */}
        <div className="flex-1">
          <BentoGrid className="h-full">
            {features.map((feature, index) => (
              <BentoCard key={index} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </div>
    </section>
  );
}

