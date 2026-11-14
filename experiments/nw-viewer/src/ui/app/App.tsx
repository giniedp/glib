import { Navigate, Route, Router } from '@solidjs/router'
import { lazy } from 'solid-js'

// each tool is its own chunk: the browser does not load the engine
const ViewerTool = lazy(() => import('../viewer/ViewerTool'))
const BrowserTool = lazy(() => import('../browser/BrowserTool'))
const DataTool = lazy(() => import('../data/DataTool'))

/**
 * The tools of the app, one route each. The state of a tool is in the query parameters.
 */
export function App() {
  return (
    <Router>
      <Route path="/viewer" component={ViewerTool} />
      <Route path="/browser" component={BrowserTool} />
      <Route path="/data" component={DataTool} />
      {/* old links (`/?level=…`) open the viewer with their parameters */}
      <Route path="*" component={ToViewer} />
    </Router>
  )
}

function ToViewer() {
  return <Navigate href={({ location }) => `/viewer${location.search}`} />
}
