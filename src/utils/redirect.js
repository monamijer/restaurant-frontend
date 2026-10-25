/**
 * Accept a post-login redirect only when it is an internal path, never an external address.
 * "//evil.example" and "https://evil.example" would otherwise send a freshly signed-in user away.
 */
export function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string' || target.length === 0) return fallback
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback
  return target
}
