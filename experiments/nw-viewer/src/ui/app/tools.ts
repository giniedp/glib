import { useLocation, useNavigate } from '@solidjs/router'

export type ToolId = 'viewer' | 'browser' | 'data'

/**
 * The query of each tool when it was left, so switching back returns to the same state
 * (e.g. the level and camera position of the viewer)
 */
const lastSearch: Partial<Record<ToolId, string>> = {}

/**
 * Navigation between the tools. The query of the tool that is left is remembered.
 *
 * @returns `current`, the shown tool, and `open(tool, search?)`, which shows a tool with the given query
 *  (`?a=b`), or with the query it had when it was left
 */
export function useTools() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = () => location.pathname.slice(1) as ToolId

  const open = (tool: ToolId, search?: string) => {
    if (tool === current() && search == null) {
      return
    }
    // the viewer writes its camera into the url without the router, read the url itself
    lastSearch[current()] = window.location.search
    navigate(`/${tool}${search ?? lastSearch[tool] ?? ''}`)
  }

  return { current, open }
}
