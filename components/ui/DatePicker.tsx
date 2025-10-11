import React, { useState, useMemo } from 'react';
import Button from './Button.tsx';

interface DatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect, minDate, maxDate }) => {
    const initialDate = selectedDate && !isNaN(new Date(selectedDate).getTime()) ? new Date(selectedDate + 'T00:00:00') : new Date();
    const [displayDate, setDisplayDate] = useState(initialDate);

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth(); // 0-11

    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
    const firstDayOfMonth = useMemo(() => new Date(year, month, 1).getDay(), [year, month]); // 0=Sun, 6=Sat

    const calendarDays = useMemo(() => {
        const days = [];
        // Blanks for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`blank-prev-${i}`} className="p-1"></div>);
        }
        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isDisabled = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate);

            days.push(
                <button
                    key={day}
                    onClick={() => onDateSelect(dateStr)}
                    disabled={isDisabled}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors
                        ${isSelected ? 'bg-primary text-white font-bold' : 'text-gray-700'}
                        ${!isSelected && !isDisabled ? 'hover:bg-primary/10' : ''}
                        ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    }, [firstDayOfMonth, daysInMonth, year, month, selectedDate, minDate, maxDate, onDateSelect]);

    const changeMonth = (delta: number) => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + delta, 1));
    };

    const monthName = displayDate.toLocaleString('default', { month: 'long' });

    return (
        <div className="bg-white p-3 rounded-lg shadow-2xl border border-gray-200 w-72">
            <div className="flex justify-between items-center mb-2">
                <Button iconOnly size="sm" variant="light" onClick={() => changeMonth(-1)} title="Previous Month">
                    <i className="fas fa-chevron-left"></i>
                </Button>
                <div className="font-semibold text-gray-800">{monthName} {year}</div>
                <Button iconOnly size="sm" variant="light" onClick={() => changeMonth(1)} title="Next Month">
                    <i className="fas fa-chevron-right"></i>
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays}
            </div>
        </div>
    );
};

export default DatePicker;
