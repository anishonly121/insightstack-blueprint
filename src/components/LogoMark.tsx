export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 7px rgba(59,130,246,0.55))" }}
    >
      {/* Three ascending bars */}
      <rect x="2"    y="20" width="7" height="10" rx="1.5" fill="#3B82F6" fillOpacity="0.28" />
      <rect x="12.5" y="13" width="7" height="17" rx="1.5" fill="#3B82F6" fillOpacity="0.56" />
      <rect x="23"   y="6"  width="7" height="24" rx="1.5" fill="#3B82F6" />
      {/* Trend line — perfectly straight, touches top-center of each bar */}
      <line
        x1="5.5" y1="20"
        x2="26.5" y2="6"
        stroke="rgba(147,197,253,0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Apex dot */}
      <circle cx="26.5" cy="6" r="2.5" fill="white" fillOpacity="0.92" />
    </svg>
  );
}
