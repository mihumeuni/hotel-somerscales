import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "./cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export const Modal = ({ open, onClose, title, children, footer, className }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const lastFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      lastFocusedRef.current = document.activeElement;
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
      if (lastFocusedRef.current instanceof HTMLElement) {
        lastFocusedRef.current.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    const handleClose = () => onClose();
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby={title ? "modal-title" : undefined}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-slate-200 bg-white p-0 shadow-xl",
        "backdrop:bg-slate-900/40",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {title && (
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 md:text-xl">
            {title}
          </h2>
        )}
        <div className="text-sm text-slate-700">{children}</div>
        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
};
