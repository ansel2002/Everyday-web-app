import { months } from '../../data/lessons';
import { Icon } from '../../ui/Icon';

type Props = { value: number; onChange: (month: number) => void };

/** Phone and tablet: a dropdown. Desktop: a row of month chips. CSS shows one of them. */
export function MonthPicker({ value, onChange }: Props) {
  return (
    <>
      <div className="month-select not-desktop">
        <label htmlFor="month-select" className="month-select__label">Month</label>
        <div className="month-select__field">
          <select id="month-select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
            {months.map((m) => (
              <option key={m.month} value={m.month}>{m.name}</option>
            ))}
          </select>
          <Icon name="chevronDown" className="month-select__chevron" />
        </div>
      </div>
      <div role="group" aria-label="Month" className="chip-row only-desktop">
        {months.map((m) => (
          <button
            key={m.month}
            type="button"
            className="chip"
            aria-pressed={m.month === value}
            aria-label={m.name}
            onClick={() => onChange(m.month)}
          >
            {m.name.slice(0, 3)}
          </button>
        ))}
      </div>
    </>
  );
}
