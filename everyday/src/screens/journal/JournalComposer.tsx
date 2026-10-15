import { useRef, useState } from 'react';
import { addJournalEntry } from '../../data/journal';
import type { Lesson } from '../../data/lessons';
import { PrivacyNote } from '../../ui/PrivacyNote';

const FALLBACK_PROMPT = 'What would you like to remember about today?';

// The unsaved draft is kept in memory only (never written to disk unencrypted),
// so it survives moving between tabs but not a reload.
let draft = '';
const readDraft = () => draft;
const writeDraft = (text: string) => {
  draft = text;
};

/** The "Today" card: the lesson-matched prompt, a writing box and "Save entry". */
export function JournalComposer({ lesson }: { lesson?: Lesson }) {
  const [text, setText] = useState(readDraft);
  const [status, setStatus] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prompt = lesson?.journalPrompt ?? FALLBACK_PROMPT;

  async function save() {
    if (!text.trim()) {
      setStatus('Write a few words first, then save.');
      textareaRef.current?.focus();
      return;
    }
    await addJournalEntry({ prompt, text: text.trim(), lessonId: lesson?.id ?? null });
    setText('');
    writeDraft('');
    setStatus('Saved. Encrypted on this device.');
  }

  return (
    <section className="card composer" aria-labelledby="composer-prompt">
      <div className="composer__label">Today</div>
      <label id="composer-prompt" htmlFor="journal-text" className="composer__prompt">
        {prompt}
      </label>
      <textarea
        id="journal-text"
        ref={textareaRef}
        className="field composer__text"
        placeholder="Write a few honest sentences"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          writeDraft(e.target.value);
          setStatus('');
        }}
      />
      <div className="composer__foot">
        <PrivacyNote />
        <button type="button" className="btn btn--outline" onClick={save}>
          Save entry
        </button>
      </div>
      <p role="status" className="composer__status">{status}</p>
    </section>
  );
}
