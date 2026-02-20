import { motion, AnimatePresence } from "motion/react";

// SVG Icons for each technology
const TechIcons = {
  Ollama: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
    </svg>
  ),
  BGE: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z"/>
    </svg>
  ),
  Milvus: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  ANN: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <circle cx="12" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="18" r="3"/>
      <line x1="12" y1="9" x2="6" y2="15" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="9" x2="18" y2="15" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  HNSW: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  ),
  MinerU: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M12 2l-8 4v6c0 5.5 3.4 10.6 8 12 4.6-1.4 8-6.5 8-12V6l-8-4z"/>
    </svg>
  ),
  BM25: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <rect x="3" y="14" width="4" height="8" rx="1"/>
      <rect x="10" y="10" width="4" height="12" rx="1"/>
      <rect x="17" y="6" width="4" height="16" rx="1"/>
    </svg>
  ),
  LLM: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  ),
  LangChain: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a2 2 0 110 4 2 2 0 010-4zm-4 9a2 2 0 110 4 2 2 0 010-4zm8 0a2 2 0 110 4 2 2 0 010-4z"/>
      <path d="M12 9v3M8.5 14.5l2-1.5M13.5 12l2 2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Encoder: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
    </svg>
  ),
  Vector: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
    </svg>
  ),
  Rerank: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
    </svg>
  ),
};

const TECH_ITEMS = [
  { name: "Ollama", Icon: TechIcons.Ollama, color: "hsl(var(--primary))" },
  { name: "BGE", Icon: TechIcons.BGE, color: "hsl(var(--secondary))" },
  { name: "Milvus", Icon: TechIcons.Milvus, color: "hsl(var(--accent))" },
  { name: "ANN", Icon: TechIcons.ANN, color: "hsl(var(--primary))" },
  { name: "HNSW", Icon: TechIcons.HNSW, color: "hsl(var(--secondary))" },
  { name: "MinerU", Icon: TechIcons.MinerU, color: "hsl(var(--accent))" },
  { name: "BM25", Icon: TechIcons.BM25, color: "hsl(var(--primary))" },
  { name: "LLM", Icon: TechIcons.LLM, color: "hsl(var(--secondary))" },
  { name: "LangChain", Icon: TechIcons.LangChain, color: "hsl(var(--accent))" },
  { name: "Encoder", Icon: TechIcons.Encoder, color: "hsl(var(--primary))" },
  { name: "Vector", Icon: TechIcons.Vector, color: "hsl(var(--secondary))" },
  { name: "Rerank", Icon: TechIcons.Rerank, color: "hsl(var(--accent))" },
];

interface OrbitalLoaderProps {
  isActive?: boolean;
  centerLabel?: string;
}

const OrbitalLoader = ({ isActive = true, centerLabel = "Victor" }: OrbitalLoaderProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div 
          className="relative w-80 h-80 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Outer orbit ring */}
          <motion.div 
            className="absolute w-72 h-72 rounded-full border-2 border-dashed border-border"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner orbit ring */}
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-dashed border-border/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Center icon with pulse */}
          <motion.div
            className="absolute w-16 h-16 rounded-full bg-foreground flex items-center justify-center shadow-xl z-10"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-background font-bold text-lg">{centerLabel.charAt(0)}</span>
          </motion.div>

          {/* Outer orbit items */}
          <motion.div
            className="absolute w-72 h-72"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            {TECH_ITEMS.slice(0, 6).map((item, index) => {
              const angle = (index * 60) * (Math.PI / 180);
              const x = Math.cos(angle) * 144 - 20;
              const y = Math.sin(angle) * 144 - 20;
              
              return (
                <motion.div
                  key={item.name}
                  className="absolute w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                  <div 
                    className="w-5 h-5"
                    style={{ color: item.color }}
                  >
                    <item.Icon />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Inner orbit items */}
          <motion.div
            className="absolute w-48 h-48"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            {TECH_ITEMS.slice(6).map((item, index) => {
              const angle = (index * 60) * (Math.PI / 180);
              const x = Math.cos(angle) * 96 - 16;
              const y = Math.sin(angle) * 96 - 16;
              
              return (
                <motion.div
                  key={item.name}
                  className="absolute w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div 
                    className="w-4 h-4"
                    style={{ color: item.color }}
                  >
                    <item.Icon />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Glow effect */}
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-primary/20 blur-xl"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Connecting lines animation */}
          <svg className="absolute w-72 h-72 pointer-events-none">
            <motion.circle
              cx="144"
              cy="144"
              r="60"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeDasharray="10 5"
              opacity="0.3"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrbitalLoader;
