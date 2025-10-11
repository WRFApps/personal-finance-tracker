
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  color?: string; // Tailwind color class e.g. 'bg-primary' or hex e.g. '#FF0000'
  height?: string; // e.g. 'h-2', 'h-4'
  showPercentageText?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  label, 
  color = 'bg-primary', 
  height = 'h-2.5',
  showPercentageText = false,
  className = ''
}) => {
  const percentage = Math.max(0, Math.min(100, value));
  const isHexColor = color.startsWith('#');

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentageText) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
          {showPercentageText && <span className="text-xs font-medium text-gray-700">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div 
        className={`w-full bg-gray-200 rounded-full ${height} dark:bg-gray-700 shadow-inner`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${percentage}%`}
      >
        <div 
          className={`${isHexColor ? '' : color} ${height} rounded-full transition-all duration-500 ease-out`} 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: isHexColor ? color : undefined 
          }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
