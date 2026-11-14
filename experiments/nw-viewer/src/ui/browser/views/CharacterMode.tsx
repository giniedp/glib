import { createSignal, For, onCleanup, Show } from 'solid-js'
import { Button } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { EngineSurface } from '../../app/EngineSurface'
import type { ViewContext } from './registry'

/**
 * How often the parts list reads the load states, until every part is loaded or failed
 */
const PARTS_POLL_MS = 250

type Part = ReturnType<NwViewer['previewCharacterParts']>[number]

/**
 * A `.cdf` shown by the engine: the skins and cloth of the character with their materials, in bind pose, with the
 * orbit camera. No skeleton, animations or bone attachments (tmp/browser-features A3). The engine shows one content
 * at a time (D5).
 */
export default function CharacterMode(props: { ctx: ViewContext; shown: boolean }) {
  let viewer: NwViewer | null = null
  const [parts, setParts] = createSignal<Part[]>([])
  let timer: ReturnType<typeof setInterval> | null = null
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  const onRunning = (it: NwViewer) => {
    viewer = it
    it.showCharacter(props.ctx.path)
    stopPolling()
    timer = setInterval(() => {
      if (viewer?.previewKey !== `character:${props.ctx.path}`) {
        return
      }
      const list = viewer.previewCharacterParts()
      setParts(list)
      if (list.length && list.every((it) => it.state !== 'loading')) {
        stopPolling()
      }
    }, PARTS_POLL_MS)
  }

  const count = (state: Part['state']) => parts().filter((it) => it.state === state).length

  return (
    <div class="nw-character">
      <div class="nw-character-parts">
        <For each={parts()}>
          {(part) => (
            <div class="nw-character-part" title={`${part.mesh}\n${part.material || 'material of the mesh'}`}>
              <span classList={{ 'nw-error': part.state === 'failed', 'nw-muted': part.state === 'loading' }}>
                {part.name || '(unnamed)'}
              </span>
              <span class="nw-muted"> {fileName(part.mesh)}</span>
            </div>
          )}
        </For>
        <Show when={!parts().length}>
          <p class="nw-note">Reading…</p>
        </Show>
      </div>
      <div class="nw-model">
        <div class="nw-view-bar">
          <Button ghost title="Point the camera at the character again" onClick={() => viewer?.framePreviewModel()}>
            Reset camera
          </Button>
          <span class="nw-view-info nw-push-end">
            {`${parts().length} parts`}
            {count('failed') ? ` · ${count('failed')} failed` : ''}
            {count('loading') ? ` · ${count('loading')} loading` : ''}
            {' · bind pose, no bone attachments · drag to turn, wheel to zoom'}
          </span>
        </div>
        <EngineSurface class="nw-model-surface" active={props.shown} onRunning={onRunning} onDetach={stopPolling} />
      </div>
    </div>
  )
}

function fileName(path: string) {
  return path.split('/').pop() ?? path
}
