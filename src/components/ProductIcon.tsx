import type { CSSProperties } from "react";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  chart: "M4 19V5 M4 19h17 M8 15l4-5 4 2 5-7",
  stack: "m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4",
  spark: "m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  down: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  code: "m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
  search: "M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  target:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0M12 10v4m-2-2h4",
  plus: "M12 5v14M5 12h14",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  wallet: "M3 7h18v14H3V7Zm0 0V3h15v4m3 5h-6v5h6",
} as const;

export function ProductIcon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
