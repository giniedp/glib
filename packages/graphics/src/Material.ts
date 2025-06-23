import { uuid } from '@gglib/utils'
import { Device } from './Device'
import { Effect, EffectOptions } from './Effect'
import { PROGRAM_BASIC } from './programs'
import {
  ShaderProgram,
  ShaderProgramOptions,
  ShaderUniformValue,
  Texture,
  TextureImage,
  TextureOptions,
} from './resources'

/**
 * @public
 */
export type MaterialParameters = Record<string, ShaderUniformValue>

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export type MaterialOptions<Parameters extends MaterialParameters = MaterialParameters> =
  | MaterialEffectOptions<Parameters>
  | MaterialEffectNameOptions<Parameters>
  | MaterialProgramOptions<Parameters>

export interface MaterialOptionsBase<Parameters extends MaterialParameters = MaterialParameters> {
  /**
   * The descriptive name of this effect
   */
  name?: string

  /**
   * User defined meta data and annotations
   */
  meta?: Record<string, any>

  /**
   * Effect parameters to be applied before rendering
   */
  parameters: Parameters
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialEffectOptions<Parameters extends MaterialParameters = MaterialParameters>
  extends MaterialOptionsBase<Parameters> {
  /**
   * The effect instance or constructor options for {@link Effect}
   */
  effect: EffectOptions
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialEffectNameOptions<Parameters extends MaterialParameters = MaterialParameters>
  extends MaterialOptionsBase<Parameters> {
  /**
   * The effect name from which to the effect should be created.
   */
  effectName: string
  technique?: string
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialProgramOptions<Parameters extends MaterialParameters = MaterialParameters>
  extends MaterialOptionsBase<Parameters> {
  /**
   * The shader program options to be used to create the effect
   */
  program: ShaderProgramOptions | ShaderProgram
}

/**
 * Defines a parameter set for a specific {@link Effect}
 *
 * @public
 * @remarks
 * A material holds a reference to a {@link Effect} and a
 * set of parameters that should be used together when rendering.
 * This allows a {@link Effect} instance to be reused across
 * multiple materials each with a different set of parameters.
 */
export class Material<Params extends MaterialParameters = MaterialParameters> {
  /**
   * A unique id
   */
  public uid: string = uuid()

  /**
   * The graphics device
   */
  public device: Device

  /**
   * A user defined name of the material
   */
  public name: string

  /**
   * User defined meta data and annotations
   */
  public meta?: Record<string, any>

  /**
   * The effect to be used
   */
  public get effect(): Effect {
    return this._effect
  }

  /**
   * Effect parameters to be applied before rendering
   */
  public parameters: Params

  protected _effect: Effect
  public constructor(device: Device, options: MaterialOptions) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    this.createParameters(options)
    this.createEffect(options)
  }

  /**
   * Draws an object with the current effect
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }) {
    this.effect.draw(drawable, this.parameters)
  }

  /**
   * Draws a full screen quad with the current effect and parameters.
   */
  public drawQuad(flipY?: boolean) {
    this.effect.drawQuad(this.parameters, flipY)
  }

  /**
   * Simply get the parameter by name.
   *
   * @remarks
   * This is a convenience method to access parameters with Type casting.
   */
  public parameter<T>(name: string): T {
    return this.parameters[name] as T
  }

  protected disposables: Texture[] = []
  protected createParameters(options: MaterialOptions) {
    const params: MaterialParameters = {
      ...((options.parameters || {}) as Params),
    }
    const textures = instantiateMaterialTextures(this.device, params)
    this.disposables.push(...textures)
    this.parameters = params as Params
  }

  protected createEffect(options: MaterialOptions) {
    let effect: Effect | EffectOptions
    if ('program' in options) {
      effect = {
        program: options.program,
      } satisfies EffectOptions
    }
    if ('effect' in options) {
      effect = options.effect
    }
    if (effect instanceof Effect) {
      this._effect = effect
    } else if (effect) {
      this._effect = this.device.createEffect(effect)
    } else {
      console.warn(`[Material] created without explicit effect or program. Using default effect.`)
      this._effect = this.device.createEffect({
        program: PROGRAM_BASIC,
      })
    }
  }

  /**
   * Checks if the underlying effect and it's techniques and programs are all ready
   */
  public isReady() {
    return this.effect.isReady()
  }

  /**
   * Disposes the underlying effect
   */
  public dispose() {
    for (const texture of this.disposables) {
      texture.dispose()
    }
    this.disposables.length = 0
    this.effect?.dispose()
    this._effect = null
    this.device = null
  }
}

export function instantiateMaterialTextures(device: Device, params: MaterialParameters): Texture[] {
  const textures: Texture[] = []
  for (const key in params) {
    const value = params[key]
    if (typeof value !== 'object') {
      continue
    }
    if (value instanceof Texture || value instanceof TextureImage) {
      continue
    }
    if (value && 'source' in value) {
      const texture = device.createTexture(value as TextureOptions)
      textures.push(texture)
      params[key] = texture
    }
  }
  return textures
}

function disposeParameters(params: MaterialParameters): void {
  if (!params) {
    return
  }
  for (const key in params) {
    const value = params[key]
    delete params[key]
    if (value instanceof Texture || value instanceof TextureImage) {
      value.dispose()
    }
  }
}
