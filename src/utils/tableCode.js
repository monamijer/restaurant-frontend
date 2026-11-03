const MAX_TOKEN_LENGTH = 300
const TOKEN_PATTERN = /^[A-Za-z0-9_\-:.=]+$/

/**
 * The table token from what a diner typed or pasted: the whole scan link
 * (https://site/scan?t=TOKEN) or just the code. Returns '' when it cannot be a token.
 */
export function extractTableToken(input) {
  const text = String(input ?? '').trim()
  if (!text) return ''

  let candidate = text
  try {
    const fromLink = new URL(text).searchParams.get('t')
    if (fromLink !== null) candidate = fromLink
  } catch {
    // Not a link: it may be the code itself.
  }
  candidate = candidate.trim()
  return candidate.length <= MAX_TOKEN_LENGTH && TOKEN_PATTERN.test(candidate) ? candidate : ''
}
