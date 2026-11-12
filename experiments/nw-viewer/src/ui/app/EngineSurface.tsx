import { createEffect, onCleanup, onMount, type JSX } from 'solid-js'
import type { NwViewer } from '../../viewer'
import { attachSurface, detachSurface, isSurface } from './engine'

/**
 * A container that shows the engine canvas, its children are placed above the canvas.
 * The engine runs while a surface is attached and is suspended when the last one detaches
 * (see ui/app/engine.ts).
 */
export function EngineSurface(props: {
  class?: string
  /**
   * Whether the surface shows the engine, default true. A surface in a hidden pane (a tab or mode that stays mounted)
   * sets it false, it attaches again when it becomes true: the last attached surface shows the canvas.
   */
  active?: boolean
  /**
   * The systems of the engine exist, it may still boot. E.g. to bind the ui. Called on every attach.
   */
  onEngine?: (viewer: NwViewer) => void
  /**
   * The engine runs: booted, content loaded, loop started. E.g. to load a level. Called on every attach.
   */
  onRunning?: (viewer: NwViewer) => void
  /**
   * The surface was detached (hidden or unmounted) while the engine was attached to it
   */
  onDetach?: (viewer: NwViewer) => void
  children?: JSX.Element
}) {
  let host!: HTMLDivElement
  // bumped on every attach and detach, a pending attach of an older generation is dropped
  let generation = 0
  let attachedTo: NwViewer | null = null

  const attach = async () => {
    const current = ++generation
    const attached = await attachSurface(host)
    if (!attached || current !== generation) {
      return
    }
    attachedTo = attached.viewer
    props.onEngine?.(attached.viewer)
    await attached.running
    // another surface may have taken over while the engine booted, e.g. the next route mounts before the old one
    // is disposed: only the surface that shows the engine opens its content
    if (current === generation && isSurface(host)) {
      props.onRunning?.(attached.viewer)
    }
  }
  const detach = () => {
    generation++
    detachSurface(host)
    const viewer = attachedTo
    attachedTo = null
    if (viewer) {
      props.onDetach?.(viewer)
    }
  }

  onMount(() => {
    createEffect(() => {
      if (props.active ?? true) {
        attach()
      } else if (attachedTo || generation) {
        detach()
      }
    })
  })
  onCleanup(detach)

  return (
    <div class={props.class ? `nw-engine-surface ${props.class}` : 'nw-engine-surface'} ref={host}>
      {props.children}
    </div>
  )
}
