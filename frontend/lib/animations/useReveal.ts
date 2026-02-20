"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { useReducedMotion } from "./useReducedMotion";

export function useReveal(
  ref: React.RefObject<HTMLElement | null>,
  options?: gsap.TweenVars
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current || reducedMotion) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        ...options,
      }
    );
  }, [ref, reducedMotion, options]);
}
