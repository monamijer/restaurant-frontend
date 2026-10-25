// Where the tokens live.
//
// - The access token (15 minutes) is kept in memory only: it never touches storage.
// - The refresh token survives a page reload in localStorage so the user stays signed in.
//   The backend rotates it on every use and blacklists the old one, which limits the damage
//   of a stolen token.

export const REFRESH_TOKEN_KEY = 'restaurant.refresh'

let accessToken = null
let fallbackRefreshToken = null // Used when localStorage is unavailable (private browsing).

function storage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const session = {
  getAccessToken() {
    return accessToken
  },

  getRefreshToken() {
    try {
      return storage()?.getItem(REFRESH_TOKEN_KEY) ?? fallbackRefreshToken
    } catch {
      return fallbackRefreshToken
    }
  },

  setTokens({ access, refresh }) {
    if (access) accessToken = access
    if (refresh) {
      fallbackRefreshToken = refresh
      try {
        storage()?.setItem(REFRESH_TOKEN_KEY, refresh)
      } catch {
        // Quota or privacy mode: the in-memory copy keeps this tab working.
      }
    }
  },

  clear() {
    accessToken = null
    fallbackRefreshToken = null
    try {
      storage()?.removeItem(REFRESH_TOKEN_KEY)
    } catch {
      // Nothing to clean up.
    }
  },
}
