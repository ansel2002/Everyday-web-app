type Props = { value: number; variant: 'header' | 'rail' | 'sidebar' };

/** The day streak: a number with a "day streak" label. Text, never colour alone. */
export function StreakCount({ value, variant }: Props) {
  return (
    <div className={`streak streak--${variant}`}>
      <span className="streak__value">{value}</span>
      <span className="streak__label">day streak</span>
    </div>
  );
}
