import React, { useEffect, useRef } from 'react';
import intlTelInput from 'intl-tel-input/intlTelInputWithUtils';
import type { Iti } from 'intl-tel-input';
import 'intl-tel-input/styles';

interface PhoneInputProps {
  value: string;
  // Emits the E.164 number (or raw text when invalid) plus whether it is a valid number.
  onChange: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
  className?: string;
}

// Picks the dial-code country from the browser language (e.g. en-IN -> in).
const guessCountry = (): string => {
  const region = navigator.language.split('-')[1];
  return region ? region.toLowerCase() : 'in';
};

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, onBlur, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<Iti | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const iti = intlTelInput(input, {
      initialCountry: guessCountry() as never,
      separateDialCode: true,
      strictMode: true,
    });
    itiRef.current = iti;

    const emit = () => {
      const raw = input.value.trim();
      if (!raw) {
        onChangeRef.current('', true);
        return;
      }
      const valid = iti.isValidNumber() === true;
      onChangeRef.current(valid ? iti.getNumber() : raw, valid);
    };

    input.addEventListener('input', emit);
    input.addEventListener('countrychange', emit);
    return () => {
      input.removeEventListener('input', emit);
      input.removeEventListener('countrychange', emit);
      iti.destroy();
      itiRef.current = null;
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="tel"
      defaultValue={value}
      onBlur={onBlur}
      className={className}
    />
  );
};
