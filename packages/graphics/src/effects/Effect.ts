import type { Device } from '../Device'
import type { RenderEncoder } from '../RenderEncoder'
import {
  ShaderModule,
  type Program,
  type ProgramOptions,
  type ShaderModuleOptions,
  type ProgramInputValue,
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
}

/**
 * Defines {@link Device} states which should be used with a specific {@link ShaderProgram}
 *
 * @public
 *
 */
export class Effect implements Disposable {
  /**
   * The graphics device
   */
  public readonly device: Device

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

  public get isReady() {
    return this.program.module.isReady
  }

  protected restoreStates: {
    cullState?: CullState
    blendState?: BlendState
    depthState?: DepthState
    offsetState?: DepthBiasState
  }

  protected disposables: Disposable[] = []

  public constructor(device: Device, options: EffectOptions) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    this.cullState = options.cullState ? CullState.get(options.cullState) : null
    this.blendState = options.blendState ? BlendState.get(options.blendState) : null
    this.depthState = options.depthState ? DepthState.get(options.depthState) : null
    this.offsetState = options.offsetState || null
    this.program = this.createProgram(options.program)
  }

  protected createProgram(options: EffectProgramOptions): Program {
    const shaderOptions = options?.shader
    if (!shaderOptions) {
      throw new Error('Shader program is required to create an Effect')
    }
    if (shaderOptions instanceof ShaderModule) {
      return shaderOptions.program.clone(options)
    }
    const shader = this.device.acquireShaderModule(shaderOptions)
    this.disposables.push(shader)
    return shader.program.clone(options)
  }

  /**
   * Applies the given parameters to the shader program of this pass and commits them.
   */
  public commit(params: Record<string, ProgramInputValue>) {
    this.program.apply(params)
    this.program.commit()
  }

  /**
   * Applies the states of the pass to the given render pass and sets the shader program active.
   */
  public apply(pass: RenderEncoder): void {
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
    pass.setProgram(this.program)
  }

  /**
   * Restores the states that were changed by `apply` to their previous values.
   *
   * @remarks
   * Restores only these previously captured states
   * - {@link Effect.cullState}
   * - {@link Effect.blendState}
   * - {@link Effect.depthState}
   * - {@link Effect.offsetState}
   */
  public restore(pass: RenderEncoder): void {
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
  }

  /**
   * Draws an object with this shader pass and given parameters
   *
   * @remarks
   * This is a convenience method that combines `apply`, `commit` and `restore` in a single call.
   * Skips rendering silently if the program is not ready.
   */
  public draw(pass: RenderEncoder, object: Renderable, params?: Record<string, ProgramInputValue>) {
    if (!this.isReady) {
      return
    }
    if (params) {
      this.commit(params)
    } else {
      this.program.commit()
    }
    this.apply(pass)
    object.render(pass)
    this.restore(pass)
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
        shared: this.program.shared,
      },
      offsetState: this.offsetState,
      blendState: this.blendState,
      depthState: this.depthState,
      cullState: this.cullState,
    }
  }

  public dispose(): void {
    this.program.dispose()
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
    this.disposables = []
  }
}
