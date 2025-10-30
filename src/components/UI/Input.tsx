import React, { useState, forwardRef } from 'react';

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
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  uppercase?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
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
      onKeyDown,
      size = 'md',
      uppercase = false,
    },
    ref
  ) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [dateMode, setDateMode] = useState<'text' | 'date'>(type === 'date' ? 'text' : 'text');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      // Special handling: custom dd/MM/yyyy for date with calendar
      if (type === 'date') {
        setInputValue(val);
        if (dateMode === 'date') {
          // Native date gives ISO; pass through
          onChange(val);
        } else {
          // Text mode; if dd/MM/yyyy convert to ISO before emitting
          const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (m) {
            const [, dd, mm, yyyy] = m;
            const iso = `${yyyy}-${mm}-${dd}`;
            onChange(iso);
          } else if (val === '') {
            onChange('');
          }
        }
        setShowSuggestions(false);
        return;
      }

      // Apply uppercase transformation for text inputs when uppercase prop is true
      if (uppercase && type !== 'number' && type !== 'date') {
        val = val.toUpperCase();
      }

      setInputValue(val);
      if (type === 'number') {
        // Allow decimal values for quantity inputs
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
          <label className={`block font-bold text-gray-700 mb-1 ${
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          }`} style={{ fontFamily: 'Times New Roman', fontSize: '14px', fontWeight: 'bold' }}>
            {label}
            {required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type === 'date' ? (dateMode === 'date' ? 'date' : 'text') : type}
          value={
            typeof value === 'number' && isNaN(value)
              ? ''
              : value === null || value === undefined
                ? ''
                : type === 'date'
                  ? (() => {
                      const v = String(value || inputValue || '');
                      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                      if (dateMode === 'date') {
                        // Native date expects ISO
                        if (m) return v;
                        const m2 = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                        if (m2) {
                          const [, dd, mm, yyyy] = m2;
                          return `${yyyy}-${mm}-${dd}`;
                        }
                        return '';
                      }
                      // Text mode shows dd/MM/yyyy
                      if (m) {
                        const [, yyyy, mm, dd] = m;
                        return `${dd}/${mm}/${yyyy}`;
                      }
                      return v;
                    })()
                  : uppercase && type !== 'number' 
                    ? String(value).toUpperCase()
                    : value
          }
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder={type === 'date' ? 'dd/MM/yyyy' : placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'
          }`}
          style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          inputMode={type === 'date' && dateMode === 'text' ? 'numeric' : undefined}
          pattern={type === 'date' && dateMode === 'text' ? '\\d{2}/\\d{2}/\\d{4}' : undefined}
          onFocus={() => {
            if (type === 'date') setDateMode('date');
            setShowSuggestions(true);
          }}
          onBlur={() => {
            if (type === 'date') setDateMode('text');
            setTimeout(() => setShowSuggestions(false), 100);
          }}
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
  }
);

Input.displayName = 'Input';

export default Input;