import { useEffect, useRef, type ReactNode } from 'react';

type Props = { open: boolean; onClose: () => void; labelledBy: string; describedBy?: string; children: ReactNode };

/**
 * A modal built on the native <dialog>: focus stays inside, Escape closes,
 * the page behind is inert, and focus returns to where it was.
 */
export function Dialog({ open, onClose, labelledBy, describedBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes without acting.
        if (e.target === ref.current) onClose();
      }}
    >
      {open && <div className="dialog__panel">{children}</div>}
    </dialog>
  );
}
