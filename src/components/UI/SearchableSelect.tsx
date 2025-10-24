import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
}

const SearchableSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(
  (
    {
      label,
      value,
      onChange,
      options,
      placeholder = 'Select an option...',
      required = false,
      disabled = false,
      className = '',
      onKeyDown,
      searchPlaceholder = 'Search...',
      noOptionsMessage = 'No options found',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get the selected option label
    const selectedOption = options.find(option => option && option.value === value);
    const displayValue = selectedOption && selectedOption.label ? selectedOption.label : '';

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
      option && option.label && typeof option.label === 'string' && 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex(prev => 
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex(prev => 
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          } else if (!isOpen) {
            // If dropdown is closed and no value is selected, open dropdown
            if (!value) {
              setIsOpen(true);
            } else {
              // If dropdown is closed and value is already selected, move to next field
              if (onKeyDown) {
                onKeyDown(e);
              }
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
        default:
          // Call the parent onKeyDown if provided
          if (onKeyDown) {
            onKeyDown(e);
          }
          break;
      }
    };

    const handleSelect = (selectedValue: string) => {
      onChange(selectedValue);
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      
      // After selecting an option, move to next field
      setTimeout(() => {
        if (onKeyDown) {
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true
          });
          onKeyDown(enterEvent as any);
        }
      }, 0);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      setSearchTerm(newSearchTerm);
      setHighlightedIndex(-1);
      
      // If user is typing and dropdown is closed, open it
      if (!isOpen && newSearchTerm.length > 0) {
        setIsOpen(true);
      }
    };

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          setSearchTerm('');
          setHighlightedIndex(-1);
        }
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setSearchTerm('');
      setHighlightedIndex(-1);
    };

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        {label && (
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            {label}
            {required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        
        <div className='relative'>
          <input
            ref={ref || inputRef}
            type='text'
            value={isOpen ? searchTerm : displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            placeholder={isOpen ? searchPlaceholder : placeholder}
            disabled={disabled}
            required={required}
            className='w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
          
          <div className='absolute inset-y-0 right-0 flex items-center'>
            {value && !disabled && (
              <button
                type='button'
                onClick={handleClear}
                className='p-1 text-gray-400 hover:text-gray-600 mr-1'
              >
                <X size={16} />
              </button>
            )}
            <div className='p-1 text-gray-400'>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </div>

        {isOpen && (
          <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === highlightedIndex
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  } ${
                    option.value === value ? 'bg-blue-50 text-blue-900 font-medium' : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className='px-3 py-2 text-gray-500 text-sm'>
                {noOptionsMessage}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';

export default SearchableSelect;

