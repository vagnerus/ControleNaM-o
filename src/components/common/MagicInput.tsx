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
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseInputValue = (value: string): number => {
  if (!value) return 0;
  // Remove R$, thousand separators, and replace comma with dot
  const cleanedValue = value
    .replace(/R\$\s?/, '')
    .replace(/\./g, '')
    .replace(/,/, '.');
  
  if (/^[0-9,.\-+*/\s()]+$/.test(cleanedValue)) {
    try {
      // Use a Function constructor for safe evaluation
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanedValue}`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return parseFloat(result.toFixed(2));
      }
    } catch (error) {
        // Fallback to simple parsing if evaluation fails
        const numericValue = parseFloat(cleanedValue);
        return isNaN(numericValue) ? 0 : numericValue;
    }
  }
  
  const numericValue = parseFloat(cleanedValue);
  return isNaN(numericValue) ? 0 : numericValue;
};


export const MagicInput = forwardRef<HTMLInputElement, MagicInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(formatCurrency(value) || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value, isEditing]);

    const handleFocus = () => {
      setIsEditing(true);
      // Show the raw number for editing, replacing comma with dot for consistency
      const rawValue = String(value).replace('.', ',');
      setDisplayValue(rawValue === '0' ? '' : rawValue);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(false);
      const rawValue = event.target.value.replace('.',',');
      const calculatedValue = parseInputValue(rawValue);
      onChange(calculatedValue);
      setDisplayValue(formatCurrency(calculatedValue));
      if (onBlur) {
        onBlur(event);
      }
    };
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
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
          className={cn(!isEditing && "pl-9")}
          {...props}
        />
      </div>
    );
  }
);

MagicInput.displayName = 'MagicInput';
