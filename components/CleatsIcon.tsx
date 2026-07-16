/**
 * A pair of soccer cleats in the team colors, used as a decorative accent
 * on the home page greeting. Pure inline SVG — no image asset needed.
 */
export function CleatsIcon({
  className = "h-8 w-auto",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 122 60"
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* Back cleat — green, facing right */}
      <g transform="translate(30 0)">
        <path
          d="M13 10 C12 5 19 2 23 6 L30 15 C35 21 44 26 53 28 L77 34 C85 36 87 40 84 43 L17 43 C12 43 10 39 10 34 Z"
          fill="#5B8A3A"
        />
        <path
          d="M30 15 C33 19 38 22 43 24 L41 28 C36 26 31 22 28 18 Z"
          fill="#EEF5E4"
          opacity="0.85"
        />
        <rect x="9" y="44" width="77" height="5" rx="2.5" fill="#436B2B" />
        <rect x="15" y="50" width="6" height="6" rx="2" fill="#436B2B" />
        <rect x="33" y="50" width="6" height="6" rx="2" fill="#436B2B" />
        <rect x="51" y="50" width="6" height="6" rx="2" fill="#436B2B" />
        <rect x="69" y="50" width="6" height="6" rx="2" fill="#436B2B" />
      </g>
      {/* Front cleat — navy, mirrored to face left, slightly lower */}
      <g transform="translate(92 4) scale(-1 1)">
        <path
          d="M13 10 C12 5 19 2 23 6 L30 15 C35 21 44 26 53 28 L77 34 C85 36 87 40 84 43 L17 43 C12 43 10 39 10 34 Z"
          fill="#1B4D7E"
        />
        <path
          d="M30 15 C33 19 38 22 43 24 L41 28 C36 26 31 22 28 18 Z"
          fill="#E4EEF7"
          opacity="0.85"
        />
        <rect x="9" y="44" width="77" height="5" rx="2.5" fill="#0F2E4D" />
        <rect x="15" y="50" width="6" height="6" rx="2" fill="#0F2E4D" />
        <rect x="33" y="50" width="6" height="6" rx="2" fill="#0F2E4D" />
        <rect x="51" y="50" width="6" height="6" rx="2" fill="#0F2E4D" />
        <rect x="69" y="50" width="6" height="6" rx="2" fill="#0F2E4D" />
      </g>
    </svg>
  );
}
