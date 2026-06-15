// Content moderation run before a QR code is generated: profanity
// filtering (English + Vietnamese), URL format validation, a domain
// blacklist, and link-shortener detection.

const ENGLISH_PROFANITY = [
  'fuck', 'fucking', 'fucker', 'fuckface', 'motherfucker',
  'shit', 'shitty', 'bullshit',
  'bitch', 'bastard',
  'asshole', 'dumbass', 'jackass',
  'dick', 'dickhead', 'cock', 'cunt', 'twat',
  'piss', 'pissed',
  'slut', 'whore',
  'douche', 'douchebag',
  'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded', 'prick',
]

// Written without diacritics; input text is tokenized and lower-cased
// before matching, but Vietnamese diacritics are preserved so phrases
// here keep them for accuracy.
const VIETNAMESE_PROFANITY = [
  'đụ', 'đụ má', 'đụ mẹ',
  'địt', 'địt mẹ', 'địt con',
  'lồn', 'cái lồn',
  'cặc', 'con cặc',
  'buồi',
  'đĩ', 'con đĩ', 'đĩ mẹ',
  'óc chó', 'súc vật', 'đồ chó', 'thằng chó', 'con chó', 'chó chết',
  'mẹ kiếp', 'cứt', 'ăn cứt',
  'khốn nạn', 'đồ khốn', 'thằng khốn',
  'đần độn', 'mất dạy', 'đồ mất dạy', 'vô học',
  // common diacritic-free internet slang
  'vcl', 'vkl', 'dmm', 'dcm', 'cmm', 'clgt',
]

export const BLOCKED_DOMAINS = ['malware.com', 'phishing.net', 'fakebank.xyz']

export const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 't.co']

const PROFANITY_MESSAGE =
  "This text contains language that isn't allowed. Please remove any offensive words and try again."

const INVALID_URL_MESSAGE = 'Please enter a valid URL (e.g. https://example.com).'
const UNSUPPORTED_PROTOCOL_MESSAGE = 'Only http:// and https:// links are supported.'
const BLOCKED_DOMAIN_MESSAGE =
  'This website is on our blocked list and cannot be used to generate a QR code.'
const SHORTENER_MESSAGE =
  'Shortened links (e.g. bit.ly, tinyurl.com) are not allowed. Please use the full destination URL.'

/**
 * Messages that represent a content-safety block (profanity, blocked
 * domains, link shorteners, malformed URLs) as opposed to plain
 * "field is required" validation. Used to decide which failed
 * submissions are worth recording as blocked QR attempts.
 */
export const CONTENT_SAFETY_MESSAGES = new Set([
  PROFANITY_MESSAGE,
  INVALID_URL_MESSAGE,
  UNSUPPORTED_PROTOCOL_MESSAGE,
  BLOCKED_DOMAIN_MESSAGE,
  SHORTENER_MESSAGE,
])

// Splits on anything that isn't a Unicode letter/number, so words keep
// their Vietnamese diacritics (\p{L} matches them) and punctuation can't
// be used to dodge the filter.
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

function containsAnyPhrase(text, phrases) {
  const tokens = tokenize(text)
  if (tokens.length === 0) return false

  const tokenSet = new Set(tokens)

  return phrases.some((phrase) => {
    const words = phrase.toLowerCase().split(/\s+/)

    if (words.length === 1) {
      return tokenSet.has(words[0])
    }

    for (let i = 0; i <= tokens.length - words.length; i += 1) {
      if (words.every((word, offset) => tokens[i + offset] === word)) return true
    }

    return false
  })
}

/**
 * Checks free-text fields (SSID, email subject/body, etc.) for English or
 * Vietnamese profanity.
 */
export function checkProfanity(text) {
  if (!text || !text.trim()) return { blocked: false }

  if (containsAnyPhrase(text, ENGLISH_PROFANITY) || containsAnyPhrase(text, VIETNAMESE_PROFANITY)) {
    return { blocked: true, message: PROFANITY_MESSAGE }
  }

  return { blocked: false }
}

/**
 * Validates the URL format, normalizing bare domains (e.g. "example.com")
 * to "https://example.com" the same way the QR payload builder does.
 */
export function checkUrlFormat(url) {
  const trimmed = (url || '').trim()

  if (!trimmed) {
    return { blocked: true, message: 'Please enter a URL.' }
  }

  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let parsed
  try {
    parsed = new URL(normalized)
  } catch {
    return { blocked: true, message: INVALID_URL_MESSAGE }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { blocked: true, message: UNSUPPORTED_PROTOCOL_MESSAGE }
  }

  if (!parsed.hostname.includes('.')) {
    return { blocked: true, message: INVALID_URL_MESSAGE }
  }

  return { blocked: false, hostname: parsed.hostname.toLowerCase() }
}

function hostnameMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

/** Blocks known malicious/unsafe domains. */
export function checkBlockedDomain(hostname) {
  const isBlocked = BLOCKED_DOMAINS.some((domain) => hostnameMatches(hostname, domain))

  if (!isBlocked) return { blocked: false }

  return { blocked: true, message: BLOCKED_DOMAIN_MESSAGE }
}

/** Blocks known URL shorteners so the destination is always transparent. */
export function checkUrlShortener(hostname) {
  const isShortener = URL_SHORTENERS.some((domain) => hostnameMatches(hostname, domain))

  if (!isShortener) return { blocked: false }

  return { blocked: true, message: SHORTENER_MESSAGE }
}

/**
 * Runs all URL checks in order: format, blocked domains, link shorteners,
 * then profanity in the URL text itself. Returns the first failure found.
 */
export function moderateUrl(url) {
  const format = checkUrlFormat(url)
  if (format.blocked) return format

  const blockedDomain = checkBlockedDomain(format.hostname)
  if (blockedDomain.blocked) return blockedDomain

  const shortener = checkUrlShortener(format.hostname)
  if (shortener.blocked) return shortener

  return checkProfanity(url)
}

/** Runs profanity moderation for free-text fields. */
export function moderateText(text) {
  return checkProfanity(text)
}
