import React, { useState } from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  suggestions?: Array<string | number>;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  step,
  suggestions = [],
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (type === 'number') {
      onChange(val === '' ? '' : val);
    } else {
      onChange(val);
    }
    setShowSuggestions(true);
  };

  const filteredSuggestions = suggestions
    .map(String)
    .filter(
      s =>
        inputValue &&
        !String(inputValue).includes(s) &&
        Math.abs(Number(s) - Number(inputValue)) < 10
    )
    .slice(0, 5);

  return (
    <div className={className} style={{ position: 'relative' }}>
      {label && (
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}
      <input
        type={type}
        value={
          typeof value === 'number' && isNaN(value)
            ? ''
            : value === null || value === undefined
              ? ''
              : value
        }
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className='absolute z-10 bg-white border border-gray-200 rounded shadow-md mt-1 w-full max-h-40 overflow-y-auto'>
          {filteredSuggestions.map((s, idx) => (
            <li
              key={idx}
              className='px-3 py-2 cursor-pointer hover:bg-blue-100'
              onMouseDown={() => {
                setInputValue(s);
                onChange(String(s));
                setShowSuggestions(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Input;
