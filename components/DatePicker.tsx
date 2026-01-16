
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './Icons';

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ChevronLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
    label: string;
    value: string; // YYYY-MM-DD or empty string
    onChange: (value: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value + 'T00:00:00') : null);
    const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
    const datePickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        const newDate = value ? new Date(value + 'T00:00:00') : null;
        setSelectedDate(newDate);
        if (newDate) {
            setViewDate(newDate);
        } else {
            setViewDate(new Date()); // Reset view to current month if date is cleared
        }
    }, [value]);

    const handleDateSelect = (day: number) => {
        const newSelectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const year = newSelectedDate.getFullYear();
        const month = (newSelectedDate.getMonth() + 1).toString().padStart(2, '0');
        const date = newSelectedDate.getDate().toString().padStart(2, '0');
        onChange(`${year}-${month}-${date}`);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const changeMonth = (delta: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="absolute top-full mt-2 z-10 bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-700 w-72">
                <div className="flex justify-between items-center mb-3">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-slate-700 text-slate-400"><ChevronLeftIcon /></button>
                    <div className="font-semibold text-slate-200">{MONTH_NAMES[month]} {year}</div>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-slate-700 text-slate-400"><ChevronRightIcon /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {DAY_NAMES.map(day => <div key={day} className="font-medium text-slate-500 text-xs w-9 h-9 flex items-center justify-center">{day}</div>)}
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {days.map(day => {
                        const isSelected = selectedDate ? (selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) : false;
                        return (
                            <button type="button" key={day} onClick={() => handleDateSelect(day)}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700'}`}>
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const formattedDate = selectedDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="relative" ref={datePickerRef}>
            <label htmlFor={`date-picker-${label}`} className="block text-sm font-medium text-slate-300">{label}</label>
            <div className="relative mt-1">
                <button
                    type="button" id={`date-picker-${label}`} onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full pl-3 pr-2 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    aria-haspopup="true" aria-expanded={isOpen}
                >
                    <span className={selectedDate ? "text-slate-200" : "text-slate-400"}>
                        {formattedDate || 'Any Date'}
                    </span>
                    <CalendarIcon />
                </button>
                {selectedDate && (
                    <button type="button" onClick={handleClear} className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-600" aria-label="Clear date">
                        <CloseIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
            {isOpen && renderCalendar()}
        </div>
    );
};
