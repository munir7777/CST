import React from 'react';

const ChevronIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);


interface AccordionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-slate-100 bg-slate-800 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset transition-colors"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronIcon isExpanded={isOpen} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-6 border-t border-slate-700">
                    {children}
                </div>
            </div>
        </div>
    );
};