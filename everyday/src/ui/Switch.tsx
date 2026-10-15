type Props = { checked: boolean; onChange: (checked: boolean) => void; labelledBy: string; describedBy?: string };

/** An on/off switch. The state is also written as "On" / "Off" next to it, never colour alone. */
export function Switch({ checked, onChange, labelledBy, describedBy }: Props) {
  return (
    <div className="switch-wrap">
      <span className="switch-state" aria-hidden="true">{checked ? 'On' : 'Off'}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch__track">
          <span className="switch__knob" />
        </span>
      </button>
    </div>
  );
}
