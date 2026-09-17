/**
 * Utility functions for WhatsApp contact integration.
 */

/**
 * Formats a phone number into a international/standardized string digits for WhatsApp.
 * Strips non-digit characters. If starts with 0 (e.g. Pakistan 03001234567), standardizes to country code if needed or digits.
 * Standard format: https://wa.me/<digits>
 */
export const getWhatsAppLink = (phone: string | undefined | null, message?: string): string => {
  if (!phone) return '#';
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '#';

  // If local Pakistani 11-digit starting with 0 (e.g., 03001234567), convert 0 to 92
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = '92' + digits.slice(1);
  } else if (digits.length === 10 && !digits.startsWith('92')) {
    // If 10 digits (e.g. 3001234567), prepend 92
    digits = '92' + digits;
  }

  const encodedMsg = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${encodedMsg}`;
};

/**
 * Opens WhatsApp chat in a new browser tab for the given phone number.
 */
export const openWhatsApp = (phone: string | undefined | null, message?: string) => {
  const link = getWhatsAppLink(phone, message);
  if (link && link !== '#') {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
};
