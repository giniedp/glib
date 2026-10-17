import { collectResourceStats, type ResourceScope, type ResourceStats, type Ownable } from '@gglib/graphics'
import { Index } from 'solid-js'
import { PollWidget, track } from 'tweak-ui'
import { ContentService } from '../../content'
import type { NwViewer } from '../../viewer'

interface ScopeRow {
  label: string
  text: string
}

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)}MB`

/**
 * Resource counts of the device, the content caches and each resource scope (global, level, regions)
 */
export function ResourcesStats(props: { viewer: NwViewer }) {
  const viewer = props.viewer
  const content = () => viewer.world.getSystem(ContentService)
  const device = () => viewer.deviceStats
  const cache = () => content()?.cacheStats
  const rows = track(() => scopeRows(viewer.device.scope), {
    interval: 1000,
    equals: (a, b) => a.length === b.length && a.every((row, i) => row.label === b[i].label && row.text === b[i].text),
  })
  return (
    <>
      <PollWidget
        label="Textures"
        value={
          device()
            ? `${device().textureCount} (${device().textureStaleCount} stale) ${mb(device().textureByteCount)}`
            : '-'
        }
      />
      <PollWidget
        label="Shaders"
        value={device() ? `${device().shaderCount} (${device().shaderStaleCount} stale)` : '-'}
      />
      <PollWidget label="Buffers" value={device()?.bufferCount ?? '-'} />
      <PollWidget
        label="Model cache"
        value={cache() ? `${cache().models} models, ${cache().modelEntries} entries` : '-'}
      />
      <PollWidget
        label="Loader cache"
        value={cache() ? `${cache().assets} assets, ${cache().containers} containers` : '-'}
      />
      <Index each={rows()}>{(row) => <PollWidget label={row().label} value={row().text} />}</Index>
    </>
  )
}

/**
 * One row per scope, depth first, children indented
 */
// reused by every poll
const walked: Ownable[] = []

function scopeRows(root: ResourceScope): ScopeRow[] {
  const result: ScopeRow[] = []
  const stats = {} as ResourceStats
  const visit = (scope: ResourceScope, depth: number) => {
    collectResourceStats(scope.walk(walked), stats)
    walked.length = 0
    result.push({ label: `${'  '.repeat(depth)}${scope.name}`, text: formatStats(stats) })
    for (const child of scope.children) {
      visit(child, depth + 1)
    }
  }
  visit(root, 0)
  return result
}

function formatStats(stats: ResourceStats) {
  const parts = [
    `${stats.textureCount} tex ${mb(stats.textureBytes)}`,
    `${stats.bufferCount} buf ${mb(stats.bufferBytes)}`,
  ]
  const counts: Array<[string, number]> = [
    ['mdl', stats.other['Model'] ?? 0],
    ['mesh', stats.meshCount],
    ['geo', stats.geometryCount],
    ['mtl', stats.materialCount],
    ['fx', stats.effectCount],
    ['prg', stats.programCount],
    ['shd', stats.shaderCount],
  ]
  for (const [name, count] of counts) {
    if (count) {
      parts.push(`${count} ${name}`)
    }
  }
  return parts.join(' · ')
}
