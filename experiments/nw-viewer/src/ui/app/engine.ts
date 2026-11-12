import type { NwViewer } from '../../viewer'

let created: Promise<NwViewer> | null = null
let instance: NwViewer | null = null
let started: Promise<void> | null = null
let running = false
/**
 * The container that shows the canvas, the last attached one
 */
let surface: HTMLElement | null = null

/**
 * The one engine of the app, created on first use. The engine code is loaded with it, so a tool
 * that never shows the engine (the browser) does not load it. Use {@link attachSurface} to show it.
 */
export function getEngine(): Promise<NwViewer> {
  created ??= createEngine()
  return created
}

async function createEngine(): Promise<NwViewer> {
  const { NwViewer } = await import('../../viewer')
  const viewer = new NwViewer({ canvas: document.createElement('canvas') })
  if (import.meta.env.DEV) {
    // handle for measurement scripts attached over CDP
    ;(globalThis as any).nwViewer = viewer
  }
  instance = viewer
  return viewer
}

export interface AttachedEngine {
  viewer: NwViewer
  /**
   * Resolves once the engine runs: booted, content loaded, loop started
   */
  running: Promise<void>
}

/**
 * Shows the engine in the container: moves the canvas into it, then boots the engine on first use
 * or resumes it. Only one container shows the engine, the last attached one.
 *
 * Resolves once the systems of the engine exist (the boot may still run), or with null if the
 * container was detached or another one attached in the meantime.
 */
export async function attachSurface(container: HTMLElement): Promise<AttachedEngine | null> {
  surface = container
  const viewer = await getEngine()
  if (surface !== container) {
    return null
  }
  viewer.placeCanvas(container)
  if (!started) {
    // creates the systems synchronously, the boot continues asynchronously
    started = viewer.run().then(() => {
      running = true
      // detached while booting
      if (!surface) {
        viewer.suspend()
      }
    })
  } else if (running) {
    viewer.resume()
  }
  return { viewer, running: started }
}

/**
 * Whether the container shows the engine: it was attached last and not detached since
 */
export function isSurface(container: HTMLElement) {
  return surface === container
}

/**
 * The container no longer shows the engine. If no other container took over, the engine is
 * suspended: no rendering, no updates, no sound, until a container is attached again.
 */
export function detachSurface(container: HTMLElement) {
  if (surface !== container) {
    return
  }
  surface = null
  if (running) {
    instance?.suspend()
  }
}
