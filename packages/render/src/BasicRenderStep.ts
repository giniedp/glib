import {
  BlendState,
  BlendStateOptions,
  Color,
  CullState,
  CullStateOptions,
  DepthState,
  DepthStateOptions,
  IBlendState,
  ICullState,
  IDepthState,
  IStencilState,
  ShaderTechnique,
  StencilState,
  StencilStateOptions,
} from '@gglib/graphics'
import { getOption } from '@gglib/utils'

import { RenderManager } from './RenderManager'
import { DrawableData, RenderStep } from './Types'
import { UniformBinder } from './UniformBinder'

/**
 * Constructor options for {@link BasicRenderStep}
 *
 * @public
 */
export interface BasicRenderStepOptions {
  /**
   * The color to be used when clearing the screen. Defaults to solid black.
   */
  clearColor?: number
  /**
   * The depth value to be used when clearing the screen. Defaults to `1`
   */
  clearDepth?: number
  /**
   * The stencil value to be used when clearing the screen. Defaults to `null`
   */
  clearStencil?: number
  /**
   * The default blend state
   */
  blendState?: BlendStateOptions
  /**
   * The default cull state
   */
  cullState?: CullStateOptions
  /**
   * The default depth state
   */
  depthState?: DepthStateOptions
  /**
   * The default stencil state
   */
  stencilState?: StencilStateOptions
}

/**
 * A basic implementation of a forward renderer
 *
 * @public
 */
export class BasicRenderStep implements RenderStep {
  public get ready() {
    return true
  }

  /**
   * The color to be used when clearing the screen. Defaults to solid black.
   */
  public clearColor: number
  /**
   * The depth value to be used when clearing the screen. Defaults to `1`
   */
  public clearDepth: number
  /**
   * The stencil value to be used when clearing the screen. Defaults to `null`
   */
  public clearStencil: number
  /**
   * The default blend state
   */
  public blendState: IBlendState
  /**
   * The default cull state
   */
  public cullState: ICullState
  /**
   * The default depth state
   */
  public depthState: IDepthState
  /**
   * The default stencil state
   */
  public stencilState: IStencilState

  public constructor(options: BasicRenderStepOptions = {}) {
    this.clearColor = getOption(options, 'clearColor', Color.Black.rgba)
    this.clearDepth = getOption(options, 'clearDepth', 1)
    this.clearStencil = getOption(options, 'clearStencil', null)
    this.blendState = BlendState.convert(getOption(options, 'blendState', BlendState.Default))
    this.cullState = CullState.convert(getOption(options, 'cullState', CullState.Default))
    this.depthState = DepthState.convert(getOption(options, 'depthState', DepthState.Default))
    this.stencilState = StencilState.convert(getOption(options, 'stencilState', StencilState.Default))
  }

  public render(manager: RenderManager) {
    const binder = manager.binder
    const scene = manager.scene
    const cam = scene.camera
    if (!scene.items.length || !cam) {
      return
    }

    binder.updateCamera(cam.world, cam.view, cam.projection)
    binder.updateLights(scene.lights)

    const rt = manager.beginStep()
    if (rt) {
      manager.device.setRenderTarget(rt)
    }

    manager.device.cullState = this.cullState
    manager.device.depthState = this.depthState
    manager.device.blendState = this.blendState
    manager.device.stencilState = this.stencilState
    manager.device.clear(this.clearColor, this.clearDepth, this.clearStencil)

    for (const item of manager.scene.items) {
      this.renderItem(item, manager.binder)
    }

    manager.device.setRenderTarget(null)
    manager.endStep(rt)
  }

  public renderItem(item: DrawableData, binder: UniformBinder) {
    const effect = item.material.effect
    const drawable = item.drawable
    const technique: ShaderTechnique = effect.technique
    for (const pass of technique.passes) {
      pass.commit(item.material.parameters)
      binder
        .updateTransform(item.transform)
        .applyTransform(pass.program)
        .applyView(pass.program)
        .applyTime(pass.program)
        .applyLights(pass.program)
      drawable.draw(pass.program)
    }
  }
}
