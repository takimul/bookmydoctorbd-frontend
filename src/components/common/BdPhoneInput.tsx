'use client';

import React from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { sanitizeBdPhoneInput, validateBdPhone, BD_OPERATOR_PREFIXES } from '@/lib/phoneUtils';

interface BdPhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function BdPhoneInput({
  value,
  onChange,
  label = 'Mobile Number (Bangladesh)',
  required = true,
  disabled = false,
  placeholder = '01XXXXXXXXX',
  className = '',
  id = 'bd-phone-input',
}: BdPhoneInputProps) {
  const validation = validateBdPhone(value);
  const digits = (value || '').replace(/\D/g, '');
  const hasStartedTyping = digits.length > 4;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // If empty, reset
    if (!raw.trim()) {
      onChange('');
      return;
    }
    const sanitized = sanitizeBdPhoneInput(raw);
    onChange(sanitized);
  };

  const getOperatorName = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let p = '';
    if (clean.startsWith('8801')) p = clean.slice(2, 5);
    else if (clean.startsWith('01')) p = clean.slice(0, 3);
    else if (clean.startsWith('1')) p = '0' + clean.slice(0, 2);

    if (p === '017' || p === '013') return 'Grameenphone';
    if (p === '019' || p === '014') return 'Banglalink';
    if (p === '018' || p === '016') return 'Robi / Airtel';
    if (p === '015') return 'Teletalk';
    return null;
  };

  const operator = getOperatorName(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {operator && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {operator}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Country Flag / Prefix Pill */}
        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-slate-500 font-mono text-xs font-bold">
          <span className="text-sm">🇧🇩</span>
          <span>+88</span>
          <span className="text-slate-300">|</span>
        </div>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={14}
          value={value.startsWith('+88') ? value.slice(3) : value}
          onChange={(e) => {
            const raw = e.target.value;
            // Always prepend +88
            const full = `+88${raw}`;
            const sanitized = sanitizeBdPhoneInput(full);
            onChange(sanitized);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-20 pr-10 py-2.5 rounded-xl border text-xs font-mono font-semibold transition focus:outline-none focus:ring-2 ${
            hasStartedTyping && !validation.isValid
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-slate-900 bg-rose-50/20'
              : hasStartedTyping && validation.isValid
              ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 text-slate-900 bg-emerald-50/10'
              : 'border-slate-200 focus:border-teal-500 focus:ring-teal-200 text-slate-900 bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
        />

        {/* Validation Icon */}
        <div className="absolute right-3 flex items-center pointer-events-none">
          {hasStartedTyping && validation.isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : hasStartedTyping && !validation.isValid ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <Phone className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {hasStartedTyping && !validation.isValid && validation.message && (
        <p className="text-[11px] text-rose-600 font-medium">{validation.message}</p>
      )}
    </div>
  );
}
