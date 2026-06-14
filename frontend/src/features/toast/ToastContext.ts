import { createContext } from "react";

export type ToastContextValue = {
  toast: string;
  flash: (message: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
