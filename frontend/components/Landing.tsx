"use client";

import Header from "./landing/Header";
import HeroSection from "./landing/HeroSection";
import AboutSection from "./landing/AboutSection";
import FeaturesSection from "./landing/FeaturesSection";
import MetricsSection from "./landing/MetricsSection";
import UploadSection from "./landing/UploadSection";
import CTASection from "./landing/CTASection";
import Footer from "./landing/Footer";
// import SectionTransition from "./landing/SectionTransition";

export default function Landing() {
  return (
    <div className="min-h-screen w-full text-white overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        {/* <SectionTransition /> */}
        <FeaturesSection />
        {/* <MetricsSection /> */}
        {/* <UploadSection /> */}
        <CTASection />  
      </main>
      <Footer />
    </div>
  );
}
