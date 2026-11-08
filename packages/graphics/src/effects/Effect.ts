import type { Device } from '../Device'
import type { RenderEncoder } from '../RenderEncoder'
import {
  ProgramInputBlock,
  ResourceOwnership,
  ShaderModule,
  type Ownable,
  type Program,
  type ProgramOptions,
  type ShaderModuleOptions,
} from '../resources'
import {
  BlendState,
  CullState,
  DepthBiasState,
  DepthState,
  type BlendStateName,
  type CullStateName,
  type DepthStateName,
} from '../states'
import type { Disposable, Renderable } from '../types'

export interface EffectProgramOptions extends ProgramOptions {
  shader: ShaderModuleOptions | ShaderModule
}

/**
 * Constructor options for {@link Effect}
 *
 * @public
 */
export interface EffectOptions {
  /**
   * The name of the effect
   */
  name?: string
  /**
   * Arbitrary meta data or info about the effect
   */
  meta?: { [key: string]: any }

  /**
   *
   */
  program: EffectProgramOptions

  /**
   * The cull state to be used for this effect
   */
  cullState?: CullStateName | CullState
  /**
   * The blend state to be used for this effect
   */
  blendState?: BlendStateName | BlendState
  /**
   * The depth state to be used for this effect
   */
  depthState?: DepthStateName | DepthState
  /**
   * The offset state to be used for this effect
   */
  offsetState?: DepthBiasState
  /**
   * Color write masks per render target index, see {@link Effect.renderMasks}
   */
  renderMasks?: ReadonlyArray<number | null | undefined>
  /**
   * Blend states per render target index, see {@link Effect.renderBlends}
   */
  renderBlends?: ReadonlyArray<BlendStateName | BlendState | null | undefined>
}

/**
 * Defines {@link Device} states which should be used with a specific {@link ShaderProgram}
 *
 * @public
 *
 */
export class Effect implements Disposable, Ownable {
  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The ownership state of this effect
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * The name of the effect
   */
  public readonly name: string | null

  /**
   * Arbitrary meta data or info about the effect
   */
  public meta: { [key: string]: any }

  /**
   * The shader program used by this effect
   */
  public readonly program: Program

  /**
   * Custom flags that can be used to tag this effect for sorting or filtering
   */
  public flags: number = Number.MAX_SAFE_INTEGER

  /**
   * The cull state to be enabled on `apply`
   */
  public cullState: CullState | null

  /**
   * The blend state to be enabled on `apply`
   */
  public blendState: BlendState | null

  /**
   * The depth state to be enabled on `apply`
   */
  public depthState: DepthState | null

  /**
   * The offset state to be enabled on `apply`
   */
  public offsetState: DepthBiasState | null

  /**
   * Color write masks per render target index to be enabled on `apply` (GPUColorWrite flags, 0 disables writing).
   * Targets without an entry are not changed. Restored to write all on `restoreState`.
   */
  public renderMasks: ReadonlyArray<number | null | undefined> | null = null

  /**
   * Blend states per render target index to be enabled on `apply`, for passes with several color targets.
   * Targets without an entry are not changed. An entry for target 0 takes precedence over {@link blendState}.
   * Restored to the previous states on `restoreState`.
   *
   * @example
   * ```ts
   * // the same blend on three GBuffer targets, each blended by its own alpha output
   * effect.renderBlends = [BlendState.Alpha, BlendState.Alpha, BlendState.Alpha]
   * ```
   */
  public renderBlends: ReadonlyArray<BlendState | null | undefined> | null = null

  public get isReady() {
    return this.program.isCompiled
  }

  public get isValid() {
    return this.program.isValid
  }

  protected restoreStates: {
    cullState?: CullState
    blendState?: BlendState
    depthState?: DepthState
    offsetState?: DepthBiasState
    renderBlends?: Array<BlendState | null>
  }

  public constructor(device: Device, options: EffectOptions) {
    this.device = device
    device.scope.adoptUntilClaimed(this)
    this.name = options.name
    this.meta = options.meta || {}
    this.cullState = options.cullState ? CullState.get(options.cullState) : null
    this.blendState = options.blendState ? BlendState.get(options.blendState) : null
    this.depthState = options.depthState ? DepthState.get(options.depthState) : null
    this.offsetState = options.offsetState || null
    this.renderMasks = options.renderMasks ?? null
    this.renderBlends = options.renderBlends?.map((it) => (it ? BlendState.get(it) : null)) ?? null
    this.program = this.createProgram(options.program)
  }

  protected createProgram(options: EffectProgramOptions): Program {
    const shaderOptions = options?.shader
    if (!shaderOptions) {
      throw new Error('Shader program is required to create an Effect')
    }
    const shader = this.ownership.adopt(
      shaderOptions instanceof ShaderModule ? shaderOptions : this.device.acquireShaderModule(shaderOptions),
    )
    return this.ownership.adopt(shader.program.clone(options))
  }

  /**
   * Applies the given input blocks to the underlying program
   *
   * @returns true if any program input has changed
   */
  public applyInputs(blocks: Record<string, ProgramInputBlock>): boolean {
    let changed = false
    for (const blockName in blocks) {
      const source = blocks[blockName]
      if (source && this.program.applyBlock(source)) {
        changed = true
      }
    }
    return changed
  }

  /**
   * Applies the states of the pass to the given render pass and sets the shader program active.
   */
  public applyState(pass: RenderEncoder): void {
    this.restoreStates ||= {}
    const restore = this.restoreStates

    if (this.offsetState) {
      restore.offsetState = pass.getDepthBiasState()
      pass.setDepthBiasState(this.offsetState)
      if (restore.offsetState === this.offsetState) {
        restore.offsetState = null
      }
    } else {
      restore.offsetState = null
    }
    if (this.blendState) {
      restore.blendState = pass.getRenderBlend(0)
      pass.setRenderBlend(0, this.blendState)
      if (restore.blendState === this.blendState) {
        restore.blendState = null
      }
    } else {
      restore.blendState = null
    }
    if (this.depthState) {
      restore.depthState = pass.getDepthState()
      pass.setDepthState(this.depthState)
      if (restore.depthState === this.depthState) {
        restore.depthState = null
      }
    } else {
      restore.depthState = null
    }
    if (this.cullState) {
      restore.cullState = pass.getCullState()
      pass.setCullState(this.cullState)
      if (restore.cullState === this.cullState) {
        restore.cullState = null
      }
    } else {
      restore.cullState = null
    }
    if (this.renderMasks) {
      for (let i = 0; i < this.renderMasks.length; i++) {
        if (this.renderMasks[i] != null) {
          pass.setRenderMask(i, this.renderMasks[i])
        }
      }
    }
    if (this.renderBlends) {
      const previous = (restore.renderBlends ||= [])
      previous.length = this.renderBlends.length
      for (let i = 0; i < this.renderBlends.length; i++) {
        const state = this.renderBlends[i]
        previous[i] = null
        if (!state) {
          continue
        }
        const current = pass.getRenderBlend(i)
        if (current !== state) {
          // target 0 restores the state from before blendState
          previous[i] = i === 0 && restore.blendState ? restore.blendState : current
          pass.setRenderBlend(i, state)
        }
      }
      if (previous[0] && restore.blendState) {
        // restored by renderBlends instead
        restore.blendState = null
      }
    }
    pass.setProgram(this.program)
  }

  /**
   * Restores the states that were changed by `applyState` to their previous values.
   *
   * @remarks
   * Restores only these previously captured states
   * - {@link Effect.cullState}
   * - {@link Effect.blendState}
   * - {@link Effect.depthState}
   * - {@link Effect.offsetState}
   * - {@link Effect.renderBlends}
   *
   * {@link Effect.renderMasks} are reset to write all channels.
   */
  public restoreState(pass: RenderEncoder): void {
    const restore = this.restoreStates
    if (!restore) {
      return
    }
    if (restore.offsetState) {
      pass.setDepthBiasState(restore.offsetState)
    }
    if (restore.blendState) {
      pass.setRenderBlend(0, restore.blendState)
    }
    if (restore.depthState) {
      pass.setDepthState(restore.depthState)
    }
    if (restore.cullState) {
      pass.setCullState(restore.cullState)
    }
    if (this.renderMasks) {
      for (let i = 0; i < this.renderMasks.length; i++) {
        if (this.renderMasks[i] != null) {
          pass.setRenderMask(i, 0xf)
        }
      }
    }
    if (this.renderBlends && restore.renderBlends) {
      for (let i = 0; i < restore.renderBlends.length; i++) {
        if (restore.renderBlends[i]) {
          pass.setRenderBlend(i, restore.renderBlends[i])
        }
      }
    }
  }

  /**
   * Draws an object with this shader pass.
   * Program inputs must be applied before calling this method.
   */
  public draw(pass: RenderEncoder, object: Renderable) {
    if (!this.program.isCompiled) {
      return
    }

    this.program.commit()

    this.applyState(pass)
    object.render(pass)
    this.restoreState(pass)
  }

  /**
   * Creates a clone of this effect
   *
   * @remarks
   * This will also clone the underlying program
   */
  public clone(): Effect {
    return new Effect(this.device, this.cloneOptions())
  }

  /**
   * Creates constructor options for a clone of this effect
   */
  public cloneOptions(): EffectOptions {
    return {
      name: this.name,
      meta: { ...(this.meta || {}) },
      program: {
        shader: this.program.module,
        sharedBlocks: this.program.sharedBlocks,
        perInstanceDataBlock: this.program.perInstanceDataBlock,
        perInstanceTransformBlock: this.program.perInstanceTransformBlock,
      },
      offsetState: this.offsetState,
      blendState: this.blendState,
      depthState: this.depthState,
      cullState: this.cullState,
      renderMasks: this.renderMasks,
      renderBlends: this.renderBlends,
    }
  }

  /**
   * Immediately finalizes this effect and its program and releases its shader module.
   * Called automatically when the last owner releases the effect.
   *
   * @remarks
   * The shader module is kept while another owner holds it.
   * Acquired shader modules are pooled and owned by the global scope unless acquired with a scope.
   */
  public dispose(): void {
    this.ownership.finalize()
  }
}
