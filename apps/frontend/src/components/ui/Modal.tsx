import type { PropsWithChildren } from "react";

import { X } from "lucide-react";

type ModalProps = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  description?: string;
}>;

export const Modal = ({ isOpen, title, description, onClose, children }: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 px-4 py-6 backdrop-blur-sm">
      <div className="panel w-full max-w-4xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-border/80 px-6 py-5">
          <div>
            <h3 className="font-display text-2xl font-semibold">{title}</h3>
            {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-white/80 p-2 text-muted transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
