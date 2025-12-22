export default function TraceabilityBG() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="absolute -top-24 -right-24 w-[320px] opacity-[0.10]"
      fill="none"
    >
      <rect x="80" y="80" width="240" height="40" rx="6" stroke="black" />
      <rect x="80" y="160" width="200" height="40" rx="6" stroke="black" />
      <rect x="80" y="240" width="160" height="40" rx="6" stroke="black" />

      <line x1="200" y1="120" x2="200" y2="160" stroke="black" />
      <line x1="200" y1="200" x2="200" y2="240" stroke="black" />
    </svg>
  );
}
