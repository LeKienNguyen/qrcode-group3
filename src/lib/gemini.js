// Secondary, AI-assisted content safety check using the Google Gemini API.
// Runs after local moderation passes. Fails open (treats content as safe
// but "unchecked") on any API/network/parsing problem so a Gemini outage
// never blocks the app entirely.

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const REQUEST_TIMEOUT_MS = 8000

function buildPrompt(content) {
  return [
    'You are a safety reviewer for a QR code generator. A user wants to encode the',
    'content below into a QR code (it may be a URL, a Wi-Fi network configuration,',
    'or an email "mailto" link). Decide whether it is safe to generate.',
    '',
    'Flag the content as unsafe if it appears to be phishing, a scam, malware',
    'distribution, or otherwise malicious or harmful. Otherwise mark it as safe.',
    '',
    'Content to review:',
    '"""',
    content,
    '"""',
    '',
    'Respond with JSON only, matching this shape:',
    '{ "safe": boolean, "reason": string }',
    'If safe, "reason" must be an empty string. If unsafe, "reason" must be a short,',
    'user-friendly explanation (e.g. "Suspicious phishing content").',
  ].join('\n')
}

/**
 * @param {string} content - The QR payload to review.
 * @returns {Promise<{ safe: boolean, reason: string, skipped: boolean, error?: string }>}
 */
export async function checkContentSafety(content) {
  const apiKey = import.meta.env.VITE_GEMINI

  if (!content || !content.trim()) {
    return { safe: true, reason: '', skipped: true }
  }

  if (!apiKey) {
    return { safe: true, reason: '', skipped: true, error: 'VITE_GEMINI API key is not configured.' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(content) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              safe: { type: 'BOOLEAN' },
              reason: { type: 'STRING' },
            },
            required: ['safe', 'reason'],
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }

    const result = JSON.parse(text)

    if (typeof result.safe !== 'boolean') {
      throw new Error('Gemini returned an unexpected response shape.')
    }

    return { safe: result.safe, reason: result.reason || '', skipped: false }
  } catch (error) {
    const message = error.name === 'AbortError' ? 'Gemini request timed out.' : error.message
    return { safe: true, reason: '', skipped: true, error: message }
  } finally {
    clearTimeout(timeoutId)
  }
}
