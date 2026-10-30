const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** A light check that catches typos; the backend decides what is really valid. */
export function isEmail(value) {
  return EMAIL_PATTERN.test(String(value ?? '').trim())
}

export function isBlank(value) {
  return String(value ?? '').trim() === ''
}
