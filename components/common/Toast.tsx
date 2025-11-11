
import React from 'react';
import { CheckIcon, XMarkIcon } from '../../constants';
import { ToastMessage } from '../../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { message, type } = toast;
  
  const baseClasses = "fixed top-5 right-5 w-full max-w-xs p-4 rounded-lg shadow-lg text-white flex items-center z-[100]";
  const typeClasses = {
    success: 'bg-status-approved',
    error: 'bg-status-rejected',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
       <div className="flex-shrink-0">
         {type === 'success' ? <CheckIcon className="w-6 h-6"/> : <XMarkIcon className="w-6 h-6"/>}
       </div>
       <div className="ml-3 text-sm font-medium">
            {message}
       </div>
       <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white/20 text-white rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-white/30" aria-label="Fechar" onClick={onClose}>
            <span className="sr-only">Fechar</span>
            <XMarkIcon className="w-5 h-5" />
        </button>
    </div>
  );
};

export default Toast;
