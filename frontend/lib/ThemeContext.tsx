"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light is the only theme
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme("light");
    // No dark mode logic needed
  }, []);

  const updateTheme = () => {
    // No-op, only light theme
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return {
    theme: "light" as const,
    setTheme: () => {},
  };
}