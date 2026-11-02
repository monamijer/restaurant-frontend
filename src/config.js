// Runtime configuration. Only VITE_* variables are exposed by Vite.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
export const API_TIMEOUT_MS = 15000

// The backend prices everything in US dollars.
export const CURRENCY = 'USD'

// English is the default language for everyone; French is one click away and remembered.
export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'fr']
