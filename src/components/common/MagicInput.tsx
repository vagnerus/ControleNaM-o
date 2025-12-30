
'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MagicInputProps extends Omit<InputProps, 'onChange' | 'value' | 'onBlur'> {
  value: number;
  onChange: (value: number) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  // This formats the number into a string like "1.234,56" for pt-BR
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseInputValue = (value: string): number => {
  if (!value) return 0;
  
  // Clean the string: remove thousand separators and replace comma with dot
  const cleanedValue = value.replace(/\./g, '').replace(/,/, '.');
  
  try {
    // Safely evaluate simple math expressions
    // Use a stricter regex to allow only numbers, comma, dot, and basic operators
    if (/^[\d,.\-+*/\s()]+$/.test(cleanedValue)) {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanedValue.replace(/,/g, '.').replace(/(?![.])[^\d*+\-/().]/g, '')}`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return parseFloat(result.toFixed(2));
      }
    }
  } catch (error) {
     // Fallback if evaluation fails
  }

  // Fallback for simple number parsing
  const numericValue = parseFloat(cleanedValue);
  return isNaN(numericValue) ? 0 : numericValue;
};


export const MagicInput = forwardRef<HTMLInputElement, MagicInputProps>(
  ({ value, onChange, onBlur, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(formatCurrency(value) || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value, isEditing]);

    const handleFocus = () => {
      setIsEditing(true);
      // Show the raw number for editing, using comma as decimal separator for pt-BR
      const rawValue = String(value).replace('.', ',');
      setDisplayValue(rawValue === '0' ? '' : rawValue);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false);
      const calculatedValue = parseInputValue(event.target.value);
      onChange(calculatedValue);
      setDisplayValue(formatCurrency(calculatedValue));
      if (onBlur) {
        onBlur(event);
      }
    };
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        // Allow numbers, comma, and math operators
        const sanitized = rawValue.replace(/[^0-9,\-+*/.]/g, '');
        setDisplayValue(sanitized);
    };

    return (
      <div className="relative">
        <span className={cn("absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm", isEditing && "hidden")}>
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(!isEditing && "pl-9 text-right", className)}
          {...props}
        />
      </div>
    );
  }
);

MagicInput.displayName = 'MagicInput';
