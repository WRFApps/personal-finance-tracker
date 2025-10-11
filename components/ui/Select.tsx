
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  containerClassName?: string;
  placeholder?: string; // Make placeholder a direct prop
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  error, 
  options, 
  placeholder,
  className = '', 
  containerClassName = '', 
  ...props 
}) => {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <select
        id={id}
        className={`block w-full pl-3 pr-10 py-2 text-base border ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-gray-300 focus:ring-primary focus:border-primary'} sm:text-sm rounded-md bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
        aria-describedby={errorId}
        defaultValue={props.value === undefined && placeholder ? "" : props.value} // Set default for placeholder
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>} 
        {options.map(option => (
          <option key={option.value.toString()} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p id={errorId} className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
};

export default Select;
