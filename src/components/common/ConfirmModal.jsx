import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmVariant = 'danger', children, disableConfirm = false }) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-700';
      case 'warning':
        return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getIconStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-rose-100 text-rose-600';
      case 'warning':
        return 'bg-amber-100 text-amber-500';
      case 'primary':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-up">
        <div className="p-6">
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center text-center mt-[-12px]">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${getIconStyles()}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-navy-dark text-[19px] mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">
              {message}
            </p>
            {children && (
              <div className="mt-4 w-full text-left">
                {children}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disableConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors ${getButtonStyles()} ${disableConfirm ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
