import type { ReactNode } from 'react';
import { useDayStreak } from '../data/useDayStreak';
import { StreakCount } from './StreakCount';

type Props = {
  title: string;
  /** Title on phone, if different (Today shows "Everyday" on phone). */
  phoneTitle?: string;
  subtitle: string;
  /** Optional action on wider layouts, e.g. "Add a habit". */
  action?: ReactNode;
  /** Sub-pages (insights, add habit) do not repeat the streak. */
  showStreak?: boolean;
};

/**
 * Phone: title, subtitle below, streak on the right.
 * Tablet and desktop: subtitle above a larger title; the streak lives in the rail or sidebar.
 */
export function PageHeader({ title, phoneTitle, subtitle, action, showStreak = true }: Props) {
  const streak = useDayStreak();
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title" tabIndex={-1}>
          {phoneTitle ? (
            <>
              <span className="only-phone">{phoneTitle}</span>
              <span className="only-wide">{title}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <div className="page-header__subtitle">{subtitle}</div>
      </div>
      {showStreak && (
        <div className="only-phone">
          <StreakCount value={streak} variant="header" />
        </div>
      )}
      {action && <div className="only-wide">{action}</div>}
    </header>
  );
}
