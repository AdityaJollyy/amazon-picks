import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastContextValue } from "./ToastContext";

/** Bottom-center toast — used for "Added X to cart" style nudges. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, flash }), [toast, flash]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-[10px] bg-[#0f1111] px-[22px] py-[13px] text-sm font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
          style={{ animation: "ap-toast 2.4s ease forwards" }}
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#46e07f] text-xs font-black text-[#0f1111]">
            ✓
          </span>
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}
