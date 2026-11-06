import type { ReactNode } from "react";
import { Modal } from "../Modal";

/** Account and credits dialogs: the shared Modal shell. */
export function Dialog({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal title={title} onClose={onClose} size={wide ? "lg" : "md"} className="acct-dialog">
      {children}
    </Modal>
  );
}
