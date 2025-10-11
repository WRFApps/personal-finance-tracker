
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Added size prop
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 transition-opacity duration-300 ease-in-out animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full m-4 ${sizeClasses[size]} transform transition-all duration-300 ease-out scale-95 opacity-0 animate-scaleUp`}
      >
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200">
          <h3 id="modal-title" className="text-xl font-semibold text-dark">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            aria-label="Close modal"
          >
            <i className="fas fa-times w-5 h-5"></i>
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end p-4 sm:p-5 space-x-2 border-t border-gray-200 rounded-b">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { 
          0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Modal;
