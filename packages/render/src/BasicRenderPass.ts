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
  EffectTechnique,
  PrimitiveBatch,
  SpriteBatch,
  StencilState,
  StencilStateOptions,
  StencilStateParams,
} from '@gglib/graphics'

import type { RenderContext } from './RenderContext'
import { DrawableInfo, isDrawableItem, isDrawablePrimitive, isDrawableSpriteItem, RenderPass } from './Types'

/**
 * Constructor options for {@link BasicRenderPass}
 *
 * @public
 */
export interface BasicRenderPassOptions {
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
export class BasicRenderPass implements RenderPass {
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

  public constructor(options: BasicRenderPassOptions = {}) {
    this.clearColor = options?.clearColor ?? Color.Black.rgba
    this.clearDepth = options?.clearDepth ?? 1
    this.clearStencil = options?.clearStencil ?? null
    this.blendState = BlendState.convert(options?.blendState ?? BlendState.Default)
    this.cullState = CullState.convert(options?.cullState ?? CullState.Default)
    this.depthState = DepthState.convert(options?.depthState ?? DepthState.Default)
    this.stencilState = StencilState.convert(options?.stencilState ?? StencilState.Default)
  }

  public render(context: RenderContext) {
    const uniforms = context.uniforms
    const camera = context.camera
    if (!camera) {
      return
    }

    this.spriteBatch ||= new SpriteBatch(context.device)
    this.primitiveBatch ||= new PrimitiveBatch(context.device)

    uniforms.updateCamera(camera.view, camera.projection)
    uniforms.updateLights(context.lights)

    context.channels.color ||= context.targets.require({
      width: context.viewport.width,
      height: context.viewport.height,
      ...context.targetOptions,
    })

    const target = context.channels.color
    context.channels.color = target
    context.device.setRenderTarget(target.image)

    context.device.cullState = this.cullState
    context.device.depthState = this.depthState
    context.device.blendState = this.blendState
    context.device.stencilState = this.stencilState
    context.device.clear(this.clearColor, this.clearDepth, this.clearStencil)

    this.spriteBatch.begin({
      viewProjection: uniforms.ViewProjection.value,
    })
    this.primitiveBatch.begin({
      viewProjection: uniforms.ViewProjection.value,
      primitiveType: 'LineList',
    })
    this.renderItems(context, camera.layerMask)
    this.spriteBatch.end()
    this.primitiveBatch.end()

    context.device.setRenderTarget(null)
  }

  protected renderItems(ctx: RenderContext, layerMask: number) {
    for (const it of ctx.scene.items) {
      if (it.hidden) {
        continue
      }

      if (isDrawableSpriteItem(it)) {
        it.item.drawSprite(this.spriteBatch)
      } else if (isDrawablePrimitive(it)) {
        it.item.drawPrimitive(this.primitiveBatch)
      } else if (isDrawableItem(it)) {
        this.renderItem(it, ctx)
      }
    }
  }

  protected renderItem(item: DrawableInfo, ctx: RenderContext) {
    const effect = item.material.effect
    const drawable = item.item
    const technique: EffectTechnique = effect.technique
    for (const pass of technique.passes) {
      if (!pass.program.isReady) {
        console.warn('Program not ready')
        continue
      }
      pass.commit(item.material.parameters)
      ctx.uniforms
        .updateTransform(item.transform)
        .applyTransform(pass.program)
        .applyView(pass.program)
        .applyTime(pass.program)
        .applyLights(pass.program)
      drawable.draw(pass.program)
    }
  }
}
