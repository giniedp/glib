import { PollWidget } from 'tweak-ui'
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
    </>
  )
}
