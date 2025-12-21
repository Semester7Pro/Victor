export default function TemporalContextBG() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="absolute -bottom-20 -right-20 w-[300px] opacity-[0.10]"
      fill="none"
    >
      <circle cx="200" cy="200" r="120" stroke="black" />
      <line x1="200" y1="200" x2="200" y2="110" stroke="black" />
      <line x1="200" y1="200" x2="270" y2="200" stroke="black" />
    </svg>
  );
}
