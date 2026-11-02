import { nextTick } from 'vue'
import { createRouter } from 'vue-router'
import { authGuard } from './guards'
import routes from './routes'
import { applyDocumentTitle } from './title'

/** After a navigation, move keyboard and screen reader focus to the new page's content. */
function focusMainContent() {
  nextTick(() => document.getElementById('main')?.focus({ preventScroll: true }))
}

export function createAppRouter(history) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  })

  router.beforeEach(authGuard)
  router.afterEach((to, from) => {
    applyDocumentTitle(to)
    // Not on the first page load, and not when only the query changes (typing in a filter
    // must not pull the focus out of the field).
    if (from.name && to.path !== from.path) focusMainContent()
  })

  return router
}
