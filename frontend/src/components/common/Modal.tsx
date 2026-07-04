import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:bg-white print:p-0"
      onClick={onClose}
    >
      <div
        className="print-area max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl print:max-h-none print:w-auto print:max-w-none print:overflow-visible print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="no-print text-xl leading-none text-slate-400 hover:text-slate-600"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
