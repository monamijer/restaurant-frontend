import { afterEach, vi } from 'vitest'

// jsdom has no canvas: the charting library is replaced by a stub.
vi.mock('chart.js', () => {
  class Chart {
    constructor(canvas, config) { this.canvas = canvas; this.config = config }
    destroy() {}
    static register() {}
  }
  return { Chart, registerables: [] }
})

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

  // jsdom does not implement scrolling; the router asks for it after every navigation.
  window.scrollTo = () => {}

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
    window.sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
}
