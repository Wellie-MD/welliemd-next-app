const MASKED_CARD_LAST4_PATTERN = /(\d{4})\s*$/

export function getMaskedCardLast4(maskedCardNumber?: string | null): string {
  return maskedCardNumber?.match(MASKED_CARD_LAST4_PATTERN)?.[1] || "****"
}
