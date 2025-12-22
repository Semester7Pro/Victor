import React from "react";

export default function MetricsSection() {
  return (
    <section className="py-20 px-4 bg-black relative z-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold mb-12 text-center text-white">
                Prototype Testing Results
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { value: "30+", label: "Documents Indexed" },
                  { value: "99%", label: "Retrieval Accuracy" },
                  { value: "95%", label: "Reduction in Research Time" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="p-8 bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-500 transition-all hover:shadow-lg hover:shadow-black/40 text-center group"
                  >
                    <h3 className="text-5xl font-bold text-white mb-2">
                      {value}
                    </h3>
                    <p className="text-neutral-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  );
}