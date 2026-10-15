import type { Habit } from '../../data/types';
import { removeHabit } from '../../data/habits';
import { Dialog } from '../../ui/Dialog';
import { Icon } from '../../ui/Icon';

type Props = { habit: Habit | null; onClose: () => void };

/** "Remove this habit?" Keeping is the primary, focused action. No red. */
export function RemoveHabitDialog({ habit, onClose }: Props) {
  async function remove() {
    if (habit) await removeHabit(habit.id);
    onClose();
    // The habit's own buttons are gone, so give focus a sensible home.
    document.querySelector<HTMLElement>('main h1')?.focus();
  }

  return (
    <Dialog open={!!habit} onClose={onClose} labelledBy="remove-title" describedBy="remove-text">
      <h2 id="remove-title" className="dialog__title">Remove this habit?</h2>
      <p id="remove-text" className="dialog__text">
        {habit?.name} and its streak will be removed, on all your devices. Your journal stays exactly as it is.
      </p>
      <button type="button" className="btn btn--primary" autoFocus onClick={onClose}>
        Keep habit
      </button>
      <button type="button" className="btn btn--outline btn--tall" onClick={remove}>
        <Icon name="trash" size={20} />
        Remove habit
      </button>
    </Dialog>
  );
}
