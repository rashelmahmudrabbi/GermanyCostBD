"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface Toast {
  id: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-5 fade-in-20 bg-background",
              toast.variant === 'destructive' && "border-destructive bg-destructive text-destructive-foreground",
              toast.variant === 'success' && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="text-sm opacity-80 mt-1">{toast.description}</p>
                )}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="text-sm font-medium underline mt-2 hover:no-underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
