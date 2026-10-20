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

  // jsdom does not implement the native <dialog> methods either. This stand-in mimics the parts
  // the application relies on: the `open` attribute and the `close` event.
  const dialog = window.HTMLDialogElement?.prototype
  if (dialog && !dialog.showModal) {
    dialog.showModal = function showModal() {
      this.setAttribute('open', '')
    }
    dialog.show = dialog.showModal
    dialog.close = function close() {
      if (!this.hasAttribute('open')) return
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
}
