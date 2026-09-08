/**
 * Generates a WhatsApp Click-to-Chat URL for a given message and phone number.
 * @param message The message to encode and send.
 * @param staffPhone The staff's phone number to send the message to.
 * @returns The generated wa.me URL, or null if no phone number is provided.
 */
export function getWhatsAppUrl(message: string, staffPhone?: string): string | null {
  if (!staffPhone) return null;

  const normalizedPhone = staffPhone.length === 10 ? `91${staffPhone}` : staffPhone;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}
