import { VignetteShader } from '@gglib/effects'
import { Device } from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import { FrameGraph, FrameResource } from '../FrameGraph'
import { RenderChannel } from '../RenderChannel'
import { RenderContext, RenderPass } from '../types'

export interface VignettePassOptions {
  enabled?: boolean
  centerX?: number
  centerY?: number
  radiusX?: number
  radiusY?: number
  inner?: number
  strength?: number
  power?: number
  color?: Vec3
}

export class VignettePass implements RenderPass {
  public name: string = 'Vignette Pass'

  public centerX = 0.5
  public centerY = 0.5
  public radiusX = 0.75
  public radiusY = 0.75
  public inner = 0.5
  public strength = 0.25
  public power = 2.0
  public color = Vec3.create(0, 0, 0)
  public enabled = true

  private device: Device
  private shader: VignetteShader
  private source: FrameResource
  private target: FrameResource
  private active = false

  public constructor(device: Device, options: VignettePassOptions = {}) {
    this.device = device
    if (device.isReady) {
      this.shader = new VignetteShader(device)
    }
    this.enabled = options.enabled ?? this.enabled
    this.centerX = options.centerX ?? this.centerX
    this.centerY = options.centerY ?? this.centerY
    this.radiusX = options.radiusX ?? this.radiusX
    this.radiusY = options.radiusY ?? this.radiusY
    this.inner = options.inner ?? this.inner
    this.strength = options.strength ?? this.strength
    this.power = options.power ?? this.power
    if (options.color) {
      this.color.initFrom(options.color)
    }
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.shader ||= new VignetteShader(this.device)
    this.active = this.enabled && this.shader.isReady

    if (this.active) {
      frame.addPass(this)
      this.source = frame.read(RenderChannel.Color)
      this.target = frame.write(RenderChannel.Color)
    } else {
      this.source = null
      this.target = null
    }
  }

  public render(ctx: RenderContext) {
    if (!this.active) {
      return
    }
    const shader = this.shader
    shader.centerX = this.centerX
    shader.centerY = this.centerY
    shader.radiusX = this.radiusX
    shader.radiusY = this.radiusY
    shader.inner = this.inner
    shader.strength = this.strength
    shader.power = this.power
    shader.color.initFrom(this.color)
    shader.textureInput = this.source.texture
    shader.textureOuput = this.target.texture

    const pass = ctx.device.renderPass
    pass.flush()
    pass.render(shader)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
