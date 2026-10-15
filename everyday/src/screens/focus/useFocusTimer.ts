import { useEffect, useState } from 'react';

/**
 * Focus timer state, kept in localStorage so a session survives moving
 * between pages or a reload. It counts from an end time, so it stays accurate
 * even if the tab sleeps. No score, no streak: nothing is recorded.
 */
export type FocusStatus = 'idle' | 'running' | 'paused' | 'done';

interface FocusState {
  minutes: number;
  label: string;
  status: FocusStatus;
  /** When running: the moment it ends (ms since epoch). */
  endsAt: number | null;
  /** When paused: the time left (ms). */
  remaining: number | null;
}

const KEY = 'everyday.focus';
const INITIAL: FocusState = { minutes: 25, label: '', status: 'idle', endsAt: null, remaining: null };

function load(): FocusState {
  try {
    return { ...INITIAL, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return INITIAL;
  }
}

function save(state: FocusState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // The timer still works for this visit.
  }
}

export function useFocusTimer() {
  const [state, setStateRaw] = useState<FocusState>(load);
  const [now, setNow] = useState(Date.now());

  const setState = (next: FocusState) => {
    save(next);
    setStateRaw(next);
  };

  useEffect(() => {
    if (state.status !== 'running') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  const total = state.minutes * 60_000;
  const remaining =
    state.status === 'running' ? Math.max(0, (state.endsAt ?? 0) - now)
    : state.status === 'paused' ? (state.remaining ?? total)
    : state.status === 'done' ? 0
    : total;

  // Finished while running: settle into "done".
  useEffect(() => {
    if (state.status === 'running' && remaining === 0) setState({ ...state, status: 'done', endsAt: null });
  });

  return {
    ...state,
    remaining,
    progress: total ? 1 - remaining / total : 0,
    setMinutes: (minutes: number) => setState({ ...state, minutes }),
    setLabel: (label: string) => setState({ ...state, label }),
    start: () => {
      setNow(Date.now());
      setState({ ...state, status: 'running', endsAt: Date.now() + total, remaining: null });
    },
    pause: () => setState({ ...state, status: 'paused', remaining, endsAt: null }),
    resume: () => {
      setNow(Date.now());
      setState({ ...state, status: 'running', endsAt: Date.now() + remaining, remaining: null });
    },
    stop: () => setState({ ...state, status: 'idle', endsAt: null, remaining: null }),
  };
}

export function formatClock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
