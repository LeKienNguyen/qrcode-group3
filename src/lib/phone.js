// Phone number normalization for `tel:` QR payloads. Accepts Vietnamese
// local numbers (leading 0) and international numbers (leading +, with or
// without spacing/punctuation), and reduces them to E.164-style digits.

const VIETNAM_COUNTRY_CODE = '+84'

// Roughly E.164: a leading "+", a non-zero first digit, 7-15 digits total.
const E164_REGEX = /^\+[1-9]\d{6,14}$/

/**
 * Strips spaces/formatting and normalizes to a `+`-prefixed international
 * number. Vietnamese local numbers (e.g. "0901234567") become "+84901234567".
 * @param {string} input
 * @returns {string}
 */
export function normalizePhone(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) return ''

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')

  if (hasPlus) return `+${digits}`
  if (digits.startsWith('0')) return `${VIETNAM_COUNTRY_CODE}${digits.slice(1)}`

  return digits
}

/**
 * @param {string} input
 * @returns {boolean} whether the normalized number looks like a valid
 * international phone number.
 */
export function isValidPhone(input) {
  return E164_REGEX.test(normalizePhone(input))
}
