/**
 * Utility functions for formatting data
 */

/**
 * Format a phone number for display
 * Input: any phone number string
 * Output: +1 xxx xxx xxxx format
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different digit lengths
  if (digits.length === 10) {
    // US number without country code: 5551234567
    return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code: 15551234567
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  } else if (digits.length > 10) {
    // International number - format with country code
    const countryCode = digits.slice(0, digits.length - 10);
    const nationalNumber = digits.slice(-10);
    return `+${countryCode} ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
  } else if (digits.length >= 7) {
    // Shorter numbers - basic formatting
    return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  // Return as-is if too short to format
  return phone;
}

/**
 * Format phone number for input/storage (strips non-digits)
 */
export function normalizePhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}
