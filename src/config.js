// Runtime configuration. Only VITE_* variables are exposed by Vite.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
export const API_TIMEOUT_MS = 15000

// The backend prices everything in US dollars.
export const CURRENCY = 'USD'

// Limits the backend enforces on an order; the cart respects them so an order is never refused for size.
export const MAX_LINE_QUANTITY = 50
export const MAX_CART_LINES = 50
export const MAX_NOTE_LENGTH = 255

// English is the default language for everyone; French is one click away and remembered.
export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'fr']
