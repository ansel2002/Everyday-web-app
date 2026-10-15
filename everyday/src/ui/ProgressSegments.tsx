type Props = { done: number; total: number; label: string };

/** Progress as shape + text: filled segments for done, outlined for the rest. */
export function ProgressSegments({ done, total, label }: Props) {
  return (
    <div role="img" aria-label={label} className="segments">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'segment segment--done' : 'segment'} />
      ))}
    </div>
  );
}
