import { useJournalEntries } from '../../data/journal';
import { pickTodayLesson, useProgress } from '../../data/progress';
import { todayKey } from '../../lib/dates';
import { PageHeader } from '../../ui/PageHeader';
import { PrivacyNote } from '../../ui/PrivacyNote';
import { EntryCard } from './EntryCard';
import { JournalComposer } from './JournalComposer';
import { MonthMoodCounts } from './MonthMoodCounts';

export function JournalScreen() {
  const progress = useProgress();
  const entries = useJournalEntries();
  const lesson = progress && pickTodayLesson(new Date().getMonth() + 1, progress, todayKey());

  return (
    <>
      <PageHeader title="Journal" subtitle="Your words, newest first" />
      <div className="journal-layout">
        <div className="journal-main">
          {progress && <JournalComposer key={lesson?.id ?? 'none'} lesson={lesson} />}
          {entries?.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
          <PrivacyNote className="privacy-note--center only-phone" />
        </div>
        {entries && (
          <div className="only-wide">
            <MonthMoodCounts entries={entries} />
          </div>
        )}
      </div>
    </>
  );
}
