/**
 * BookMyDoctorBD - Frontend Bangladeshi Phone Number Utilities
 *
 * Enforces Bangladeshi Mobile Operators (013-019)
 * Canonical format: +8801XXXXXXXXX (14 chars)
 */

export const BD_OPERATOR_PREFIXES = ['013', '014', '015', '016', '017', '018', '019'];

/**
 * Sanitizes and enforces Bangladeshi phone input while typing.
 * Prevents non-numeric characters, auto-adds +8801 prefix, and limits length to 14 chars.
 */
export function sanitizeBdPhoneInput(input: string): string {
  if (!input) return '+8801';

  // Extract digits only
  const rawDigits = input.replace(/\D/g, '');

  // Case 1: user cleared everything or entered only '+'
  if (rawDigits.length === 0) {
    return '+8801';
  }

  // Case 2: starts with 8801
  if (rawDigits.startsWith('8801')) {
    const remaining = rawDigits.slice(4, 13); // max 9 digits after 8801
    return `+8801${remaining}`;
  }

  // Case 3: starts with 880
  if (rawDigits.startsWith('880')) {
    const remaining = rawDigits.slice(3, 13);
    return `+880${remaining}`;
  }

  // Case 4: starts with 01
  if (rawDigits.startsWith('01')) {
    const remaining = rawDigits.slice(2, 11);
    return `+8801${remaining}`;
  }

  // Case 5: user entered starting with 1
  if (rawDigits.startsWith('1')) {
    const remaining = rawDigits.slice(1, 10);
    return `+8801${remaining}`;
  }

  // Any other digits, append after +8801
  const validDigits = rawDigits.slice(0, 9);
  return `+8801${validDigits}`;
}

/**
 * Validates whether a given phone string is a complete and valid Bangladeshi mobile number.
 */
export function validateBdPhone(phone: string): { isValid: boolean; message?: string; national?: string } {
  if (!phone) {
    return { isValid: false, message: 'Bangladeshi mobile number is required.' };
  }

  const digits = phone.replace(/\D/g, '');

  let national = '';
  if (digits.startsWith('8801') && digits.length === 13) {
    national = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    national = digits;
  } else if (digits.startsWith('1') && digits.length === 10) {
    national = '0' + digits;
  } else {
    return {
      isValid: false,
      message: 'Mobile number must be 11 digits (e.g. 01712345678 or +8801712345678).',
    };
  }

  const prefix = national.slice(0, 3);
  if (!BD_OPERATOR_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      message: `Invalid operator code (${prefix}). Must start with 013, 014, 015, 016, 017, 018, or 019.`,
    };
  }

  return {
    isValid: true,
    national,
  };
}

/**
 * Pretty prints a BD mobile number e.g. +880 1712-345678
 */
export function formatBdPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  const val = validateBdPhone(phone);
  if (!val.isValid || !val.national) return phone;
  const n = val.national;
  return `+880 ${n.slice(1, 5)}-${n.slice(5)}`;
}
