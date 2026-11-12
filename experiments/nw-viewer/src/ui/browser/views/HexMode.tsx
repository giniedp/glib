import { createResource, Match, Switch } from 'solid-js'
import { HexView } from '../../common/HexView'
import { formatBytes } from '../../common/format'
import { contentBytes } from './content'
import { hexMark, type showBytes } from './marks'
import type { ViewContext } from './registry'

/**
 * The raw bytes of the file. Loaded when the mode is first shown. Marks the range of {@link showBytes}.
 */
export function HexMode(props: { ctx: ViewContext }) {
  const [bytes] = createResource(() => props.ctx.path, contentBytes)
  return (
    <Switch>
      <Match when={bytes.error}>
        <p class="nw-note">The file could not be read: {String(bytes.error)}</p>
      </Match>
      <Match when={bytes()}>
        {(data) => (
          <HexView
            bytes={data()}
            highlight={hexMark(props.ctx.path)}
            tools={<span class="nw-muted">{`${formatBytes(data().length)} (${data().length.toLocaleString()} bytes)`}</span>}
          />
        )}
      </Match>
      <Match when={bytes.loading}>
        <p class="nw-note">Reading…</p>
      </Match>
    </Switch>
  )
}
