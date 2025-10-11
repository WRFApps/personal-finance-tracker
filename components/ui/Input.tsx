import React, { useState, useRef, useEffect } from 'react';
import DatePicker from './DatePicker.tsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', leftIcon, rightIcon, inputRef, type, ...props }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleDateSelect = (date: string) => {
    // Simulate a change event to pass back to the form's handler
    const event = {
      target: {
        value: date,
        id: id,
        name: props.name
      }
    } as React.ChangeEvent<HTMLInputElement>;
    if (props.onChange) {
      props.onChange(event);
    }
    setIsPickerOpen(false);
  };
  
  const errorId = error && id ? `${id}-error` : undefined;

  if (type === 'date') {
    return (
      <div className={`mb-4 relative ${containerClassName}`} ref={wrapperRef}>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <div className="relative rounded-md shadow-sm">
          <input
            id={id}
            ref={inputRef}
            type="text" // Use text type to prevent native picker
            className={`block w-full px-3 py-2 border ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-gray-300 focus:ring-primary focus:border-primary'} rounded-md sm:text-sm placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 cursor-pointer ${className}`}
            aria-describedby={errorId}
            value={props.value || ''}
            onFocus={() => setIsPickerOpen(true)}
            readOnly // Prevent manual typing
            placeholder={props.placeholder || 'YYYY-MM-DD'}
            {...props} // Pass through min/max etc. to be used by DatePicker
            onChange={() => {}} // Suppress React warning for readOnly with onChange
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
             <i className="fas fa-calendar-alt text-gray-400"></i>
          </div>

          {isPickerOpen && (
            <div className="absolute z-20 top-full mt-2 left-0">
              <DatePicker
                selectedDate={props.value as string}
                onDateSelect={handleDateSelect}
                minDate={props.min as string}
                maxDate={props.max as string}
              />
            </div>
          )}
        </div>
        {error && <p id={errorId} className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
      </div>
    );
  }

  // Original return for other input types
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="relative rounded-md shadow-sm">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <span className="text-gray-500 sm:text-sm">{leftIcon}</span>
          </div>
        )}
        <input
          id={id}
          ref={inputRef}
          type={type}
          className={`block w-full px-3 py-2 border ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-gray-300 focus:ring-primary focus:border-primary'} rounded-md sm:text-sm placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          aria-describedby={errorId}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
             <span className="text-gray-500 sm:text-sm">{rightIcon}</span>
          </div>
        )}
      </div>
      {error && <p id={errorId} className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
};

export default Input;
