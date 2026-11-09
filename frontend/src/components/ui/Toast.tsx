import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const borders = {
          success: 'border-[#BDD3C3] dark:border-[#25422C]',
          alert: 'border-[#E8BFB5] dark:border-[#52251F]',
          info: 'border-[#D9D6CF] dark:border-[#2D333D]',
        };

        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-[#3F6B4A] dark:text-[#529E68] shrink-0 mt-0.5" />,
          alert: <AlertCircle className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54] shrink-0 mt-0.5" />,
          info: <Info className="w-4 h-4 text-[#171717] dark:text-[#F0EDE6] shrink-0 mt-0.5" />,
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 bg-white dark:bg-[#1E2228] rounded-[6px] border ${borders[toast.type]} shadow-md dark:shadow-xl text-xs text-[#171717] dark:text-[#F0EDE6] transition-all`}
          >
            <div className="flex items-start gap-2.5">
              {icons[toast.type]}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
