import {
  BlendState,
  BlendStateOptions,
  BlendStateParams,
  Color,
  CullState,
  CullStateOptions,
  CullStateParams,
  DepthState,
  DepthStateOptions,
  DepthStateParams,
  PrimitiveBatch,
  PrimitiveType,
  ShaderTechnique,
  SpriteBatch,
  StencilState,
  StencilStateOptions,
  StencilStateParams,
} from '@gglib/graphics'
import { getOption } from '@gglib/utils'

import { RenderManager } from './RenderManager'
import { RenderStep, SceneItemPrimitive, SceneItemDrawable, SceneItemSprite } from './Types'

/**
 * Constructor options for {@link CommonRenderStep}
 *
 * @public
 */
export interface CommonRenderStepOptions {
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
export class CommonRenderStep implements RenderStep {
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
  public blendState: BlendStateParams
  /**
   * The default cull state
   */
  public cullState: CullStateParams
  /**
   * The default depth state
   */
  public depthState: DepthStateParams
  /**
   * The default stencil state
   */
  public stencilState: StencilStateParams

  protected spriteBatch: SpriteBatch
  protected primitiveBatch: PrimitiveBatch

  public constructor(options: CommonRenderStepOptions = {}) {
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
    const view = manager.view
    const cam = view.camera || scene.camera
    if (!cam) {
      return
    }
    if (!this.spriteBatch) {
      this.spriteBatch = new SpriteBatch(manager.device)
    }
    if (!this.primitiveBatch) {
      this.primitiveBatch = new PrimitiveBatch(manager.device)
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

    this.spriteBatch.begin({
      viewProjection: binder.ViewProjection.value,
    })
    this.primitiveBatch.begin({
      viewProjection: binder.ViewProjection.value,
      primitiveType: PrimitiveType.LineList,
    })
    this.renderItems(manager)
    this.spriteBatch.end()
    this.primitiveBatch.end()

    manager.device.setRenderTarget(null)
    manager.endStep(rt)
  }

  protected renderItems(manager: RenderManager) {
    for (const item of manager.scene.items) {
      if (item.type === 'sprite') {
        (item as SceneItemSprite).sprite.draw(this.spriteBatch)
      } else if (item.type === 'primitive') {
        (item as SceneItemPrimitive).primitive.draw(this.primitiveBatch)
      } else {
        this.renderItem(item as SceneItemDrawable, manager)
      }
    }
  }

  protected renderItem(item: SceneItemDrawable, manager: RenderManager) {
    const effect = item.material.effect
    const drawable = item.drawable
    const technique: ShaderTechnique = effect.technique
    for (const pass of technique.passes) {
      pass.commit(item.material.parameters)
      manager.binder
        .updateTransform(item.transform)
        .applyTransform(pass.program)
        .applyView(pass.program)
        .applyTime(pass.program)
        .applyLights(pass.program)
      drawable.draw(pass.program)
    }
  }
}
