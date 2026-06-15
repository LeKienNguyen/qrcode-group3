// WCAG-style contrast ratio helpers used to warn when the chosen
// foreground/background colors could make a QR code hard to scan.

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((channel) => channel + channel)
          .join('')
      : normalized

  const int = Number.parseInt(value, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

const HEX_PATTERN = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/

export function isValidHexColor(value) {
  return HEX_PATTERN.test(value)
}

export function getContrastRatio(hexA, hexB) {
  if (!isValidHexColor(hexA) || !isValidHexColor(hexB)) return null

  const luminanceA = relativeLuminance(hexToRgb(hexA))
  const luminanceB = relativeLuminance(hexToRgb(hexB))
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)

  return (lighter + 0.05) / (darker + 0.05)
}
