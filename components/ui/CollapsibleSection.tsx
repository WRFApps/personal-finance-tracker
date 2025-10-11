import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  actionButton?: React.ReactNode;
  badgeCount?: number;
  className?: string; // Allow passing additional Tailwind classes
}

// Renamed the component function to match the intended export name directly.
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
  actionButton,
  badgeCount,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center">
          {icon && <i className={`fas ${icon} mr-3 text-primary dark:text-primary-light text-lg sm:text-xl`}></i>}
          <h3 className="text-lg sm:text-xl font-semibold text-dark dark:text-gray-100">{title}</h3>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-danger rounded-full">
              {badgeCount}
            </span>
          )}
        </div>
        <div className="flex items-center">
          {actionButton && !isOpen && <div className="mr-2 sm:mr-3">{actionButton}</div>}
          <i className={`fas fa-chevron-down transform transition-transform duration-300 text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      {isOpen && (
        <div id={`collapsible-content-${title.replace(/\s+/g, '-')}`} className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
          {actionButton && <div className="mb-4 flex justify-end">{actionButton}</div>}
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection;