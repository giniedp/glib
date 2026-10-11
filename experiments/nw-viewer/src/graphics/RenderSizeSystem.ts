import { GameSystem, type GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { ViewerConfig } from '../config'

/**
 * Sets the render size of the device and how the canvas is displayed, from the config
 * (renderResolution, renderScaling)
 *
 * @remarks
 * Replaces the autosize of the device. It observes the element that contains the canvas:
 * - `window`: the render size follows the container size in device pixels, the canvas fills the container (CSS)
 * - fixed size: the render size stays fixed, the canvas is centered in the container and sized by the scaling mode
 *   - `fit`: scaled to fit the container, keeps the aspect ratio
 *   - `none`: one render pixel per device pixel, cropped if larger than the container
 */
export class RenderSizeSystem extends GameSystem {
  private device: Device
  private config: ViewerConfig
  private canvas: HTMLCanvasElement | null = null
  private observer: ResizeObserver | null = null
  private unsubscribe: Array<() => void> = []

  /**
   * Size of the canvas container in CSS pixels and device pixels
   */
  private container = { cssWidth: 0, cssHeight: 0, width: 0, height: 0 }

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.config = world.getSystem(ViewerConfig)
    const canvas = this.device.canvas
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.parentElement) {
      return
    }
    this.canvas = canvas
    this.observer = new ResizeObserver(this.handleResize)
    this.observer.observe(canvas.parentElement)
    this.unsubscribe.push(this.config.onChange('renderResolution', this.apply))
    this.unsubscribe.push(this.config.onChange('renderScaling', this.apply))
    // the device sizes the output from the canvas once it is ready, apply the config again after that
    this.device.ready.then(this.apply)
  }

  public destroy(): void {
    this.observer?.disconnect()
    this.observer = null
    this.unsubscribe.forEach((off) => off())
    this.unsubscribe.length = 0
  }

  private handleResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0]
    const container = this.container
    container.cssWidth = entry.contentRect.width
    container.cssHeight = entry.contentRect.height
    const devicePixels = entry.devicePixelContentBoxSize?.[0]
    container.width = devicePixels ? devicePixels.inlineSize : Math.round(container.cssWidth * devicePixelRatio)
    container.height = devicePixels ? devicePixels.blockSize : Math.round(container.cssHeight * devicePixelRatio)
    this.apply()
  }

  private apply = () => {
    const container = this.container
    const canvas = this.canvas
    if (!canvas || !container.width || !container.height) {
      return
    }

    const resolution = parseResolution(this.config.value.renderResolution)
    if (!resolution) {
      // follow the window, the stylesheet sizes the canvas to the container
      resetCanvasStyle(canvas)
      this.device.resize(container.width, container.height)
      return
    }

    this.device.resize(resolution.width, resolution.height)
    // CSS size for one render pixel per device pixel
    const devicePixelsPerCss = container.width / container.cssWidth
    let width = resolution.width / devicePixelsPerCss
    let height = resolution.height / devicePixelsPerCss
    if (this.config.value.renderScaling === 'fit') {
      const scale = Math.min(container.cssWidth / width, container.cssHeight / height)
      width *= scale
      height *= scale
    }
    Object.assign(canvas.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: `${width}px`,
      height: `${height}px`,
      transform: 'translate(-50%, -50%)',
    })
  }
}

/**
 * Parses a resolution like `1920x1080`, null for `window`
 */
function parseResolution(value: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(value)
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

function resetCanvasStyle(canvas: HTMLCanvasElement) {
  Object.assign(canvas.style, {
    position: '',
    left: '',
    top: '',
    width: '',
    height: '',
    transform: '',
  })
}
