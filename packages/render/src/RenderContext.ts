import { Texture, TextureImage, ViewportStateParams } from "@gglib/graphics"
import type { Renderer } from "./Renderer"
import type { OutputSemantic, SceneComposition, SceneView } from "./Types"

export class RenderContext {
  public renderer: Renderer

  public get device() {
    return this.renderer.device
  }

  public get targets() {
    return this.renderer.targets
  }

  /**
   * Global uniforms that can be used in shaders
   */
  public get uniforms() {
    return this.renderer.uniforms
  }

  /**
   * Default render target options
   */
  public get targetOptions() {
    return this.renderer.targetOptions
  }

  /**
   * The composition that is currently being rendered
   */
  public scene: SceneComposition

  /**
   * The view that is currently being rendered
   */
  public view: SceneView

  /**
   * The viewport area where this view should be rendered to
   */
  public viewport: ViewportStateParams

  /**
   * The name of the channel to present on screen at the end of the pipeline
   */
  public channel: string

  /**
   * The render channels used during rendering
   */
  public channels: Partial<Record<OutputSemantic, Texture>>

  /**
   * The width of the viewport or render target
   */
  public get width() {
    return this.viewport.width
  }

  /**
   * The height of the viewport or render target
   */
  public get height() {
    return this.viewport.height
  }

  /**
   * The render pass queue being rendered
   */
  public get steps() {
    return this.view.steps || this.scene.steps || this.renderer.steps
  }

  /**
   * The camera being used for rendering
   */
  public get camera() {
    return this.view.camera || this.scene.camera
  }

  public get items() {
    return this.scene.items
  }

  public get lights() {
    return this.scene.lights
  }

  public constructor(renderer: Renderer) {
    this.renderer = renderer
  }

  public prepare(composition: SceneComposition, view: SceneView) {
    this.scene = composition
    this.view = view

    this.viewport ||= {}
    this.channel ||= 'color'
    this.channels ||= {}

    const viewport = this.view.viewport || this.renderer.viewport
    if (viewport.width <= 1 && viewport.height <= 1 && viewport.x <= 1 && viewport.y <= 1) {
      // normalized coordinates
      const w = this.device.drawingBufferWidth
      const h = this.device.drawingBufferHeight
      this.viewport.x = viewport.x * w
      this.viewport.y = viewport.y * h
      this.viewport.width = viewport.width * w
      this.viewport.height = viewport.height * h
    } else {
      // pixel coordinates
      this.viewport.x = viewport.x
      this.viewport.y = viewport.y
      this.viewport.width = viewport.width
      this.viewport.height = viewport.height
    }

    // auto resize existing channels
    for (const key in this.channels) {
      const target = this.channels[key as OutputSemantic]
      if (!target) {
        continue
      }
      if (target.width == this.width && target.height == this.height) {
        continue
      }
      this.channels[key] = this.renderer.targets.require({
        width: this.width,
        height: this.height,
        depthFormat: this.targetOptions.depthFormat,
        format: this.targetOptions.format,
      })
    }
  }

  /**
   * Replaces the named render target with a new one and releases the old one.
   */
  public swapChannel(name: OutputSemantic, target: Texture) {
    if (this.channels[name] === target) {
      console.warn(`channel ${name} already set to the same target. Not swapping.`)
      return
    }

    if (this.channels[name]) {
      this.renderer.targets.release(this.channels[name])
    }
    this.channels[name] = target
  }

  public dispose() {
    if (!this.channels) {
      return
    }
    for (const key in this.channels) {
      if (!this.channels[key]) {
        continue
      }
      this.renderer.targets.release(this.channels[key])
      delete this.channels[key]
    }
    this.scene = null
    this.view = null
    this.viewport = null
    this.channel = null
    this.channels = null
  }
}
