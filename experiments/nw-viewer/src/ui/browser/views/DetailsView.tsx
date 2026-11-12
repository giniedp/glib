import { For, Show } from 'solid-js'
import { Group, PollWidget } from 'tweak-ui'
import { formatBytes } from '../../common/format'
import type { ContentKind } from './content'
import type { ViewContext } from './registry'

const KIND_LABEL: Record<ContentKind, string> = {
  text: 'Text',
  objectstream: 'Binary object stream',
  'objectstream-xml': 'XML object stream',
  binary: 'Binary',
}

/**
 * Everything the archive and the catalog know about a file, for looking it up. Nothing here is needed to work
 * with the file, so the other views do not repeat it.
 */
export function DetailsView(props: { ctx: ViewContext }) {
  const stat = () => props.ctx.stat
  const assetId = () => {
    const catalog = stat().catalog
    if (!catalog) {
      return ''
    }
    return catalog.subId ? `${catalog.guid}:${catalog.subId.toString(16)}` : catalog.guid
  }
  return (
    <div class="nw-details">
      <Group title="File">
        <PollWidget label="Path" value={stat().path} />
        <PollWidget label="Type" value={props.ctx.type?.label ?? ''} />
        <PollWidget label="Content" value={KIND_LABEL[props.ctx.kind]} />
        <PollWidget label="Size" value={`${formatBytes(stat().size)} (${stat().size.toLocaleString()} bytes)`} />
        <PollWidget label="Packed" value={formatBytes(stat().compressedSize)} />
        <PollWidget label="Pak" value={stat().pak} />
        <PollWidget label="CRC32" value={stat().crc32} />
        <PollWidget label="Modified" value={stat().modified} />
      </Group>
      <Group title="Catalog">
        <Show when={stat().catalog} fallback={<p class="nw-note">Not in the catalog</p>}>
          <PollWidget label="Asset id" value={assetId()} />
          <PollWidget label="Type id" value={stat().catalog.type} />
        </Show>
      </Group>
      <Show when={stat().parts.length}>
        <Group title="Split parts">
          <For each={stat().parts}>
            {(part) => (
              <PollWidget
                label={part.alpha ? (part.mip ? `Alpha mip ${part.mip}` : 'Alpha') : `Mip ${part.mip}`}
                value={part.path.slice(part.path.lastIndexOf('/') + 1)}
              />
            )}
          </For>
        </Group>
      </Show>
    </div>
  )
}
