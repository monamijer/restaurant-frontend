import { translate } from '@/i18n'
import { useRestaurantStore } from '@/store/restaurant'

/** The browser tab title: the page, then the restaurant name. */
export function applyDocumentTitle(route) {
  const { name } = useRestaurantStore()
  const key = route.meta.titleKey
  document.title = key ? `${translate(key)} · ${name}` : name
}
