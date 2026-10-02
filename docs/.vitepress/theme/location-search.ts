import { inBrowser, type Router } from 'vitepress'
import { ref } from 'vue'

/**
 * Reactive copy of `location.search`, updated after every route change
 *
 * @remarks
 * In production builds, vitepress does not remount the page when only the query changes,
 * so components that depend on the query must watch this instead of reading it once on mount.
 */
export const locationSearch = ref(inBrowser ? location.search : '')

export function trackLocationSearch(router: Router) {
  if (!inBrowser) {
    return
  }
  const onAfterRouteChange = router.onAfterRouteChange
  router.onAfterRouteChange = async (to) => {
    await onAfterRouteChange?.(to)
    locationSearch.value = location.search
  }
}
