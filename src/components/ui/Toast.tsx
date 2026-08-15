import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@/context/NotificationContext';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'text-success-600 bg-success-50 dark:bg-success-600/10',
  error: 'text-error-600 bg-error-50 dark:bg-error-600/10',
  info: 'text-primary-600 bg-primary-50 dark:bg-primary-600/10',
  warning: 'text-warning-600 bg-warning-50 dark:bg-warning-600/10',
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm animate-slide-up">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg animate-scale-in"
          >
            <div className={`p-1.5 rounded-lg ${colorMap[toast.type]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{toast.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
