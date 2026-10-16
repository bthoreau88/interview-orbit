import { useId } from "react";

/**
 * Original ORBIT wordmark: forward-leaning Space Grotesk (OFL-1.1) set inside a tilted
 * orbital ring whose back half passes behind the letters and front half in front.
 * Built from scratch; no reference lettering was traced or adapted.
 */
export function OrbitWordmark({ variant = "compact" }: { variant?: "compact" | "hero" }) {
  const gid = useId().replace(/:/g, "");
  const hero = variant === "hero";
  return (
    <svg
      className={hero ? "wordmark wordmark-hero" : "wordmark"}
      viewBox={hero ? "0 0 300 110" : "0 12 300 78"}
      role="img"
      aria-label="Interview Orbit"
      focusable="false"
    >
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#11192C" />
          <stop offset="0.55" stopColor="#1F4FC4" />
          <stop offset="1" stopColor="#6A47C9" />
        </linearGradient>
        <linearGradient id={`ring-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#A4E9ED" />
          <stop offset="0.5" stopColor="#316AF2" />
          <stop offset="1" stopColor="#8C68DF" />
        </linearGradient>
      </defs>
      {hero && (
        <text
          x="150"
          y="104"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize="13"
          fontWeight="600"
          letterSpacing="9"
          fill="#47506A"
        >
          INTERVIEW
        </text>
      )}
      <g transform="rotate(-8 150 50)">
        <path d="M 12 50 A 138 20 0 0 1 288 50" fill="none" stroke={`url(#ring-${gid})`} strokeWidth="3" opacity="0.7" />
      </g>
      <text
        x="150"
        y="72"
        textAnchor="middle"
        transform="skewX(-10) translate(9 0)"
        fontFamily="Space Grotesk, ui-sans-serif, system-ui, sans-serif"
        fontSize="64"
        fontWeight="700"
        letterSpacing="-1"
        fill={`url(#fill-${gid})`}
      >
        ORBIT
      </text>
      <g transform="rotate(-8 150 50)">
        <path d="M 288 50 A 138 20 0 0 1 12 50" fill="none" stroke={`url(#ring-${gid})`} strokeWidth="4" strokeLinecap="round" />
        <circle cx="256" cy="63" r="6" fill="#316AF2" stroke="#F7F8FB" strokeWidth="2" />
      </g>
    </svg>
  );
}
