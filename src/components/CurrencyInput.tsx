import React from 'react';
import { formatCurrency, parseCurrencyInput } from '../utils/input-formatters';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onValueChange: (value: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onValueChange, ...props }) => (
  <input
    {...props}
    type="text"
    inputMode="numeric"
    value={formatCurrency(value)}
    onChange={(event) => onValueChange(parseCurrencyInput(event.target.value))}
  />
);
