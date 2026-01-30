import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  const styles = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      icon: 'text-success-600',
      text: 'text-success-900',
    },
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      icon: 'text-danger-600',
      text: 'text-danger-900',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: 'text-warning-600',
      text: 'text-warning-900',
    },
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      icon: 'text-sky-600',
      text: 'text-sky-900',
    },
  };

  const style = styles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-soft-md min-w-[320px] max-w-md',
        style.bg,
        style.border
      )}
    >
      <div className={clsx('flex-shrink-0', style.icon)}>{icons[toast.type]}</div>
      <p className={clsx('flex-1 text-sm font-medium', style.text)}>{toast.message}</p>
      <button
        onClick={onClose}
        className={clsx(
          'flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5',
          style.icon
        )}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
