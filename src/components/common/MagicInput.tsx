
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
  
  // Clean the string: remove thousand separators (dots) and replace decimal comma with dot
  // Example: "1.234,56" -> "1234.56"
  // Example: "1,234.56" -> "1234.56" (if user types US style, though we target PT-BR)
  
  // Strategy:
  // 1. Remove all non-numeric characters except ',' and '.'
  // 2. If both ',' and '.' are present:
  //    - If last occurrence is ',', treat '.' as thousand sep.
  //    - If last occurrence is '.', treat ',' as thousand sep.
  // 3. If only ',' is present, treat as decimal (PT-BR).
  // 4. If only '.' is present:
  //    - If multiple dots, treat as thousand sep.
  //    - If single dot, treat as decimal (or thousand sep? Ambiguous. Prefer decimal for consistency with programming, but PT-BR uses comma. Let's assume input follows display format).
  
  // Simplified robust strategy for PT-BR input (since display is PT-BR):
  // Remove dots (thousand sep), replace comma with dot.
  
  let cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
  
  // Handle edge case where user might use dots as decimals (e.g. 10.50) without thousand seps
  // If the string has multiple dots after replacement (e.g. 1.2.3), it's invalid or we take the last one?
  // 1.234,56 -> 1234.56 (correct)
  // 1000 -> 1000 (correct)
  // 10,50 -> 10.50 (correct)
  
  const numericValue = parseFloat(cleanedValue);
  return isNaN(numericValue) ? 0 : numericValue;
};


export const MagicInput = forwardRef<HTMLInputElement, MagicInputProps>(
  ({ value, onChange, onBlur, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setDisplayValue(formatCurrency(value));
    }, []);

    useEffect(() => {
        if (mounted && !isEditing) {
            setDisplayValue(formatCurrency(value));
        }
    }, [value, isEditing, mounted]);

    const handleFocus = () => {
      setIsEditing(true);
      // Show the raw number for editing, using comma as decimal separator for pt-BR
      // If value is 0, undefined or null, show empty to allow typing fresh
      const rawValue = (value === 0 || value === undefined || value === null) ? '' : String(value).replace('.', ',');
      setDisplayValue(rawValue);
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
        // Allow only numbers and comma/dot
        const sanitized = rawValue.replace(/[^0-9,.]/g, '');
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
