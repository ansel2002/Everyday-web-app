/** Line icons from the design: 24px grid, 1.8 stroke, round caps. Always decorative (aria-hidden). */
const sunRays = 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4';

const paths = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d={sunRays} />
    </>
  ),
  book: <path d="M5 5h9a4 4 0 0 1 4 4v10H9a4 4 0 0 1-4-4z" />,
  habit: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M7 12.5l3.2 3.2L17 9" />
    </>
  ),
  journal: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 9h6M9 13h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="3" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M7 12.5l3.2 3.2L17 9" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  rings: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="9.5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 13V9.5M10 3h4" />
    </>
  ),
  bars: <path d="M5 19v-6M12 19V6M19 19v-9" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h3M11 17h9" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  // Moods: a mouth line that rises with the mood. Bright uses the sun.
  moodLow: <path d="M5 16q7-6 14 0" />,
  moodFlat: <path d="M5 12h14" />,
  moodOkay: <path d="M5 13q7 3 14 0" />,
  moodGood: <path d="M5 11q7 8 14 0" />,
};

export type IconName = keyof typeof paths;

type Props = { name: IconName; size?: number; strokeWidth?: number; className?: string };

export function Icon({ name, size = 24, strokeWidth = 1.8, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
