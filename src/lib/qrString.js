// Helpers that turn form values into the raw payload string encoded in a QR code.

export function buildUrlValue({ url }) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// Escapes characters that have special meaning in the WIFI: payload spec.
function escapeWifiValue(value = '') {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildWifiValue({ ssid, password, encryption, hidden }) {
  const trimmedSsid = ssid.trim()
  if (!trimmedSsid) return ''

  const segments = [`T:${encryption}`, `S:${escapeWifiValue(trimmedSsid)}`]

  if (encryption !== 'nopass') {
    segments.push(`P:${escapeWifiValue(password)}`)
  }

  if (hidden) {
    segments.push('H:true')
  }

  return `WIFI:${segments.join(';')};;`
}

export function buildEmailValue({ email, subject, body }) {
  const trimmedEmail = email.trim()
  if (!trimmedEmail) return ''

  const params = new URLSearchParams()
  if (subject.trim()) params.set('subject', subject.trim())
  if (body.trim()) params.set('body', body.trim())

  const query = params.toString()
  return `mailto:${trimmedEmail}${query ? `?${query}` : ''}`
}
