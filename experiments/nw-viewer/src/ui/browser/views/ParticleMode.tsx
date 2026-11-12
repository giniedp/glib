import { createEffect, createMemo, createResource, createSignal, For, Match, onCleanup, Show, Switch } from 'solid-js'
import { TextInput } from 'tweak-ui'
import { parseParticleLibrary, type ParticleEffectNode } from '../../../formats/particles/parse'
import type { NwViewer } from '../../../viewer'
import { EngineSurface } from '../../app/EngineSurface'
import { contentBytes } from './content'
import type { ViewContext } from './registry'

/**
 * How often the toolbar reads the emitter and particle counts of the shown effect
 */
const STATS_POLL_MS = 500

/**
 * A particle library (`libs/particles/*.xml`): its top level effects, the selected one shown by the engine at the
 * origin. One shot effects restart every few seconds. The library is parsed in the frontend (formats/particles), the
 * engine loads the effect through its particle system. The engine shows one content at a time (D5).
 */
export default function ParticleMode(props: { ctx: ViewContext; shown: boolean }) {
  const [library] = createResource(
    () => props.ctx.path,
    async (path) => parseParticleLibrary(new TextDecoder().decode(await contentBytes(path))),
  )
  // the effects with params or sub emitters, as the game spawns them
  const effects = createMemo(() => (library()?.effects ?? []).filter((it) => it.attrs || it.children.length))
  const [filter, setFilter] = createSignal('')
  const shownEffects = createMemo(() => {
    const f = filter().toLowerCase()
    return f ? effects().filter((it) => it.fullName.toLowerCase().includes(f)) : effects()
  })
  const [selected, setSelected] = createSignal<string | null>(null)
  createEffect(() => {
    if (!selected() && effects().length) {
      setSelected(effects()[0].fullName)
    }
  })

  let viewer: NwViewer | null = null
  const [stats, setStats] = createSignal<ReturnType<NwViewer['particlePreviewStats']>>(null)
  let timer: ReturnType<typeof setInterval> | null = null
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  const show = () => {
    const effect = selected()
    if (viewer && effect && props.shown) {
      viewer.showParticleEffect(props.ctx.path, effect)
    }
  }
  createEffect(show)

  const onRunning = (it: NwViewer) => {
    viewer = it
    show()
    stopPolling()
    timer = setInterval(() => setStats(viewer?.particlePreviewStats() ?? null), STATS_POLL_MS)
  }

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={library.error}>
        <div class="nw-empty">
          <p class="nw-note">The particle library could not be read: {String(library.error?.message ?? library.error)}</p>
        </div>
      </Match>
      <Match when={library()}>
        <div class="nw-particles">
          <div class="nw-particles-list">
            <div class="nw-view-bar">
              <TextInput
                class="nw-view-filter"
                placeholder="Filter effects"
                value={filter()}
                onInput={(value) => setFilter(value)}
              />
            </div>
            <div class="nw-particles-effects">
              <For each={shownEffects()}>
                {(effect) => (
                  <button
                    class="nw-particles-effect"
                    classList={{ 'nw-particles-effect-active': selected() === effect.fullName }}
                    title={effect.fullName}
                    onClick={() => setSelected(effect.fullName)}
                  >
                    {effect.name}
                    <span class="nw-muted"> {describeEffect(effect)}</span>
                  </button>
                )}
              </For>
            </div>
            <div class="nw-view-info nw-particles-count">
              {shownEffects().length} of {effects().length} effects
            </div>
          </div>
          <div class="nw-model">
            <div class="nw-view-bar">
              <span class="nw-view-info">
                {selected() ?? 'no effect'}
                <Show when={stats()}>
                  {(s) => ` · ${s().state} · ${s().emitters} emitters · ${s().particles} particles`}
                </Show>
                {' · one shots restart every 3 s · drag to turn, wheel to zoom'}
              </span>
            </div>
            <EngineSurface class="nw-model-surface" active={props.shown} onRunning={onRunning} onDetach={stopPolling} />
          </div>
        </div>
      </Match>
    </Switch>
  )
}

/**
 * Number of sub emitters, folders have no params of their own
 */
function describeEffect(effect: ParticleEffectNode) {
  const count = countNodes(effect) - 1
  return count ? `+${count}` : ''
}

function countNodes(node: ParticleEffectNode): number {
  let result = 1
  for (const child of node.children) {
    result += countNodes(child)
  }
  return result
}
