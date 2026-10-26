'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration: number = 4500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, message, title, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message: string, title?: string) => addToast('success', message, title || 'Success'),
    error: (message: string, title?: string) => addToast('error', message, title || 'Notice'),
    warning: (message: string, title?: string) => addToast('warning', message, title || 'Warning'),
    info: (message: string, title?: string) => addToast('info', message, title || 'Information'),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast Overlay Container - High Z-Index (999999) & Maximum Contrast over white and dark backgrounds */}
      <div
        aria-live="assertive"
        className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: 'border-l-emerald-500 shadow-emerald-950/20',
            error: 'border-l-rose-500 shadow-rose-950/20',
            warning: 'border-l-amber-500 shadow-amber-950/20',
            info: 'border-l-sky-500 shadow-sky-950/20',
          }[t.type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[t.type];

          const iconWrapperStyles = {
            success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
            error: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
            warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
            info: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto bg-slate-950 text-white border-y border-r border-slate-800 border-l-4 rounded-xl p-4 shadow-2xl flex items-start gap-3.5 transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 ${typeStyles}`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${iconWrapperStyles}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <div className="font-bold text-sm leading-tight text-white mb-1 tracking-tight">
                    {t.title}
                  </div>
                )}
                <div className="text-xs text-slate-200 font-medium leading-relaxed break-words">
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType['toast'] => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
