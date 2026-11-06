import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./ui";

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  /** sm 400 · md 520 · lg 720 */
  size?: "sm" | "md" | "lg";
  /** Footer actions, primary right-most. */
  footer?: ReactNode;
  /** While false (an export is running), Esc and the backdrop don't close it. */
  dismissable?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The one dialog shell: focus trap, first field (or primary) autofocused,
 * Esc and backdrop close, focus returns to the opener, aria-modal + labelledby.
 */
export function Modal({
  title,
  onClose,
  size = "md",
  footer,
  dismissable = true,
  className,
  children,
}: ModalProps) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const dismissRef = useRef(dismissable);
  useEffect(() => {
    closeRef.current = onClose;
    dismissRef.current = dismissable;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const el = box.current;
    const first =
      el?.querySelector<HTMLElement>("[autofocus], .modal__body input, .modal__body textarea") ??
      el?.querySelector<HTMLElement>(".modal__foot .btn--primary") ??
      el?.querySelector<HTMLElement>(`.modal__body ${FOCUSABLE.split(",")[0]}`) ??
      el;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissRef.current) {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === "Tab" && el) {
        const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const [a, z] = [items[0], items[items.length - 1]];
        if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement))) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={() => dismissRef.current && closeRef.current()}>
      <div
        ref={box}
        className={["modal", `modal--${size}`, className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          {dismissable && (
            <IconButton icon="close" label="Close" shortcut="Esc" size={16} onClick={onClose} />
          )}
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
