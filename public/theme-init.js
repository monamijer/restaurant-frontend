// Runs before the app: sets the theme from the saved choice, else from the system preference.
(function () {
  try {
    var stored = localStorage.getItem('restaurant.theme')
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var theme = stored === 'dark' || stored === 'light' ? stored : dark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
  } catch {
    document.documentElement.setAttribute('data-theme', 'light')
  }
})()
