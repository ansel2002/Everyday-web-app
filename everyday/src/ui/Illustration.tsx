/**
 * Illustrations from the IllustrationSet board: flat shapes in sun and teal tints,
 * 2.5px ink lines. Colours come from tokens, so both themes work. Always decorative.
 */

/** Sprout on the hills, for the empty Habits screen. */
export function Sprout() {
  return (
    <svg width="180" height="130" viewBox="0 0 180 130" aria-hidden="true" focusable="false">
      <circle cx="118" cy="52" r="30" fill="var(--sun)" />
      <path d="M0 112Q60 78 120 100T180 92V130H0Z" fill="var(--hill-1)" />
      <path d="M0 124Q70 104 130 118T180 114V130H0Z" fill="var(--hill-2)" />
      <path d="M62 104V78" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M62 82Q50 80 46 68Q58 66 62 80ZM62 78Q72 74 78 62Q64 62 62 76Z" fill="var(--ink)" />
    </svg>
  );
}

/** Soft rings around a small sun, for the Calm corner. */
export function Rings() {
  return (
    <svg className="rings" width="110" height="110" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="18" fill="var(--sun)" />
      <circle cx="60" cy="60" r="32" fill="none" stroke="var(--sun)" strokeOpacity=".6" strokeWidth="2" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="var(--sun)" strokeOpacity=".35" strokeWidth="2" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="var(--sun)" strokeOpacity=".18" strokeWidth="2" />
    </svg>
  );
}

/** Wide sunrise banner for the top of the lesson card. */
export function SunriseBanner({ height }: { height?: number }) {
  return (
    <svg
      className="sunrise-banner"
      viewBox="0 0 342 120"
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="342" height="120" fill="var(--sky)" />
      <circle cx="246" cy="84" r="38" fill="var(--sun)" />
      <path d="M0 92Q90 50 190 86T342 72V120H0Z" fill="var(--hill-1)" />
      <path d="M0 110Q110 80 230 104T342 98V120H0Z" fill="var(--hill-2)" />
    </svg>
  );
}
