export default function DocumentIngestionBG() {
  return (
    <svg
      viewBox="-4.8 -4.8 57.6 57.6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className="absolute -top-24 -right-24 w-[320px] opacity-50"
    >
      <g
        stroke="#000000"
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Top right small icon */}
        <line x1={28.4318} y1={12.9115} x2={30.5405} y2={12.9115} />
        <line x1={28.4318} y1={15.0202} x2={29.8024} y2={15.0202} />
        <line x1={28.4318} y1={12.9115} x2={28.4318} y2={17.1289} />

        {/* Letter shapes */}
        <path d="M23.5849 17.129v-4.2174h.6853c1.1598 0 2.1087.9489 2.1087 2.1087s-.9489 2.1087-2.1087 2.1087h-.6853Z" />
        <path d="M18.9045 16.8963v-4.2174h1.3707c.7908 0 1.4234.6326 1.4234 1.4234s-.6326 1.4234-1.4234 1.4234h-1.3707" />

        {/* Text lines */}
        <path d="M16.6627 35.6723h7.6508" />
        <path d="M16.6921 32.6919h13.7214" />
        <path d="M16.6921 29.5563h16.1546" />
        <path d="M16.6627 20.7264h16.1546" />
        <path d="M16.6921 25.919h16.1546" />

        {/* Main document */}
        <rect
          x={12.8772}
          y={9.2878}
          width={23.3737}
          height={30.0519}
          rx={2.0054}
          ry={2.0054}
        />

        {/* Corner brackets */}
        <path d="M13.2512 5.4749H7.0302v6.3715" />
        <path d="M34.7237 5.4749h6.3214v6.3715" />
        <path d="M41.0451 36.2288v6.2963h-6.3214" />
        <path d="M13.2512 42.5251H7.0302v-6.2963" />

        {/* Divider */}
        <path d="M5.5 24.0878H42.5" />
      </g>
    </svg>
  );
}
