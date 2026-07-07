import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// 닫힘 애니메이션이 끝날 때까지 DOM에 남겨둘 시간(ms). index.css의 transition duration과 맞춘다.
const TRANSITION_MS = 150;

export default function Modal({ open, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  // open 변경에 동기적으로 따라가야 하는 상태는 effect 대신 렌더 중 조정한다
  // (React 공식 패턴) — mounted는 즉시 true여야 rAF가 트랜지션을 걸 수 있고,
  // visible은 즉시 false여야 닫힘 트랜지션이 바로 시작된다.
  if (open && !mounted) {
    setMounted(true);
  }
  if (!open && visible) {
    setVisible(false);
  }

  useEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (open) return;

    const timeout = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-150 print:static print:bg-white print:p-0 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`print-area max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl transition-all duration-150 print:max-h-none print:w-auto print:max-w-none print:overflow-visible print:shadow-none print:scale-100 print:opacity-100 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
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
