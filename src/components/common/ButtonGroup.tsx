import React from 'react';

interface ButtonGroupOption {
  label: string;
  value: string;
}

interface ButtonGroupProps {
  options: ButtonGroupOption[];
  value: string;
  onChange: (value: string) => void;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ options, value, onChange }) => {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm transition-colors w-full ${
            value === option.value
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
