
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'light' | 'dark' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg'; // Added xs size
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean; // Added isLoading state
  iconOnly?: boolean; // For icon-only buttons to adjust padding
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  leftIcon,
  rightIcon,
  isLoading = false,
  iconOnly = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    xs: `px-2 py-1 text-xs ${iconOnly ? 'p-1.5' : ''}`,
    sm: `px-2.5 py-1.5 text-sm ${iconOnly ? 'p-2' : ''}`,
    md: `px-4 py-2 text-sm ${iconOnly ? 'p-2.5' : ''}`,
    lg: `px-6 py-3 text-base ${iconOnly ? 'p-3' : ''}`,
  };

  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary/90 focus:ring-primary",
    secondary: "bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary",
    danger: "bg-danger text-white hover:bg-danger/90 focus:ring-danger",
    warning: "bg-warning text-dark hover:bg-warning/90 focus:ring-warning", // text-dark for better contrast on amber
    light: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400 border border-gray-300",
    dark: "bg-dark text-white hover:bg-gray-700 focus:ring-gray-600",
    outline: "bg-transparent border border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary disabled:text-gray-400 disabled:border-gray-300 disabled:hover:bg-transparent"
  };

  const iconSpacing = iconOnly ? '' : (children ? 'mr-2' : '');
  const rightIconSpacing = iconOnly ? '' : (children ? 'ml-2' : '');


  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <i className={`fas fa-spinner fa-spin ${iconSpacing}`}></i>}
      {!isLoading && leftIcon && <span className={iconSpacing}>{leftIcon}</span>}
      {!iconOnly && children}
      {!isLoading && rightIcon && <span className={rightIconSpacing}>{rightIcon}</span>}
    </button>
  );
};

export default Button;
