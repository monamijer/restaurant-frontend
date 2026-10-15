import { afterEach } from 'vitest'

// Component tests run in jsdom; pure-logic tests opt into Node and have no `window` at all.
if (typeof window !== 'undefined') {
  // jsdom does not implement matchMedia; the theme code asks for the system preference.
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })
  }

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
}
