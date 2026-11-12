import { createSignal, type Accessor } from 'solid-js'
import { getTypes, type AssetType, type TypeGroup } from '../../api/browse'
import svgAtom from '../icons/atom.svg?raw'
import svgBrain from '../icons/brain.svg?raw'
import svgCube from '../icons/cube.svg?raw'
import svgFileAudio from '../icons/file-audio.svg?raw'
import svgFileCode from '../icons/file-code.svg?raw'
import svgFileDashedLine from '../icons/file-dashed-line.svg?raw'
import svgFileImage from '../icons/file-image.svg?raw'
import svgFileLines from '../icons/file-lines.svg?raw'
import svgFile from '../icons/file.svg?raw'
import svgFilm from '../icons/film.svg?raw'
import svgGear from '../icons/gear.svg?raw'
import svgLayerGroup from '../icons/layer-group.svg?raw'
import svgMountain from '../icons/mountain.svg?raw'
import svgPalette from '../icons/palette.svg?raw'
import svgPersonRunning from '../icons/person-running.svg?raw'
import svgSparkles from '../icons/sparkles.svg?raw'
import svgTable from '../icons/table.svg?raw'
import svgWindow from '../icons/window.svg?raw'

const [types, setTypes] = createSignal<AssetType[]>([])
let loading: Promise<void> | null = null

/**
 * The asset types of the archive, a file's `type` is an index into it. Loaded once, empty until then.
 */
export function assetTypes(): Accessor<AssetType[]> {
  loading ??= getTypes().then(
    (list) => {
      setTypes(list)
    },
    (err) => {
      loading = null
      console.error('asset types not loaded:', String(err))
    },
  )
  return types
}

const GROUP_ICONS: Record<TypeGroup, string> = {
  other: svgFile,
  texture: svgFileImage,
  geometry: svgCube,
  animation: svgPersonRunning,
  material: svgPalette,
  slice: svgLayerGroup,
  script: svgFileCode,
  data: svgTable,
  ui: svgWindow,
  audio: svgFileAudio,
  video: svgFilm,
  effects: svgSparkles,
  physics: svgAtom,
  terrain: svgMountain,
  ai: svgBrain,
  config: svgGear,
  hidden: svgFileDashedLine,
}

/**
 * The icon of a file by the group of its type. Ungrouped text files get the text icon.
 */
export function typeIcon(type: AssetType | undefined): string {
  if (!type) {
    return svgFile
  }
  if (type.group === 'other' && type.format !== 'binary') {
    return svgFileLines
  }
  return GROUP_ICONS[type.group]
}
