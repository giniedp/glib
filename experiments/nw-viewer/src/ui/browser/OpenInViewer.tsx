import { createSignal, Show } from 'solid-js'
import { Button, Icon } from 'tweak-ui'
import { getLevels } from '../../api/browse'
import type { LevelIndex } from '../../api/types'
import { useTools } from '../app/tools'
import svgMountainSun from '../icons/mountain-sun.svg?raw'

const [levels, setLevels] = createSignal<LevelIndex | null>(null)
let loading: Promise<void> | null = null

/**
 * The levels of the viewer, loaded once on first use, null until then
 */
function levelIndex() {
  loading ??= getLevels().then(
    (index) => {
      setLevels(index)
    },
    (err) => {
      loading = null
      console.error('level list not loaded:', String(err))
    },
  )
  return levels()
}

/**
 * The viewer query that shows a file or folder, null if the viewer can not show it:
 * - a model (`.cgf`, `.skin`): `?model=`
 * - a material (`.mtl`): `?material=`
 * - a level folder (`levels/<level>`): `?level=` with the camera at the first game mode map's spawn, like the scenes
 *   dialog of the viewer
 */
export function viewerSearch(path: string, folder: boolean, index: LevelIndex | null): string | null {
  const params = new URLSearchParams()
  if (folder) {
    const name = path.startsWith('levels/') ? path.slice('levels/'.length) : null
    const level = name ? index?.coatlicues.find((it) => it.level.toLowerCase() === name) : null
    if (!level) {
      return null
    }
    const [x, y, z, w] = (level.maps[0]?.teamTeleportData.split('+')[0] || '1024,1024,256,0').split(',')
    params.set('level', level.name)
    params.set('x', x || '0')
    params.set('y', y || '0')
    params.set('z', z || '0')
    params.set('w', w || '0')
  } else if (/\.(cgf|skin)$/.test(path)) {
    params.set('model', path)
  } else if (path.endsWith('.mtl')) {
    params.set('material', path)
  } else {
    return null
  }
  return `?${params}`
}

/**
 * Opens the file or folder in the viewer tool. Shown only for what the viewer can show (see {@link viewerSearch}).
 */
export function OpenInViewer(props: { path: string; folder?: boolean }) {
  const tools = useTools()
  const search = () => viewerSearch(props.path, !!props.folder, props.folder ? levelIndex() : null)
  return (
    <Show when={search()}>
      {(it) => (
        <Button
          ghost
          title="Show it in the viewer tool"
          icon={<Icon svg={svgMountainSun} />}
          onClick={() => tools.open('viewer', it())}
        >
          Open in viewer
        </Button>
      )}
    </Show>
  )
}
