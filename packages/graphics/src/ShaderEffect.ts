import { copy } from '@gglib/utils'

import { ShaderProgram, ShaderProgramOptions } from './ShaderProgram'
import { ShaderTechnique, ShaderTechniqueOptions } from './ShaderTechnique'

import { Device } from './Device'
import { ShaderPass } from './ShaderPass'
import { ShaderUniformParameter } from './ShaderUniform'

/**
 * @public
 */
export interface ShaderEffectOptions {
  /**
   * A user defined name of the effect
   */
  name?: string
  /**
   * The parameters to be applied to the effect
   */
  parameters?: { [key: string]: ShaderUniformParameter }
  /**
   * A collection of programs of an effect
   *
   * @remarks
   * `techniques` option is mutually exclusive with `program` option
   */
  techniques?: Array<ShaderTechniqueOptions | ShaderTechnique> | ShaderTechnique
  /**
   * The name or index of the default technique of an effect. Defaults to `0`
   */
  technique?: string | number

  /**
   * The program to be used on this effect
   *
   * @remarks
   * `program` option is mutually exclusive with `techniques` option.
   * If this is given, then `tehniques` and `technique` options are ignored and
   * instead created from this single program
   */
  program?: ShaderProgram | ShaderProgramOptions
}

/**
 *
 */
export type ShaderEffectLabel = string

function makeArray(arg: any): any {
  if (Array.isArray(arg)) {
    return arg.slice()
  } else if (arg) {
    return [arg]
  } else {
    return []
  }
}

/**
 * Combines multiple `ShaderTechnique`s in one effect.
 *
 * @public
 * @remarks
 * There is only one active technique at a time which can be switched via `useTechnique`.
 */
export class ShaderEffect {
  /**
   * A symbol identifying the `ShaderEffect[]` type.
   */
  public static readonly Array = Symbol('ShaderEffect[]')

  /**
   * A symbol identifying the `ShaderEffectOptions` type.
   */
  public static readonly Options = Symbol('ShaderEffectOptions')

  /**
   * A symbol identifying the `ShaderEffectOptions[]` type.
   */
  public static readonly OptionsArray = Symbol('ShaderEffectOptions[]')

  /**
   * A symbol identifying the `ShaderEffectLabel` type.
   */
  public static readonly Label = Symbol('Label')

  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * A user defined name of the effect
   */
  public name: string
  /**
   * The effect parameters
   */
  public parameters: { [key: string]: ShaderUniformParameter }
  /**
   * The technique collection
   */
  public techniques: ShaderTechnique[]
  /**
   * The technique that is currently active
   */
  public technique: ShaderTechnique

  /**
   *
   */
  constructor(device: Device, options?: ShaderEffectOptions) {
    this.device = device
    if (options) {
      this.setup(options)
    }
  }

  public setup(options: ShaderEffectOptions) {
    this.name = options.name
    this.parameters = options.parameters || {}
    this.techniques = []

    let program: ShaderProgram
    if (options.program instanceof ShaderProgram) {
      program = options.program
    } else if (options.program) {
      program = new ShaderProgram(this.device, options.program)
    }
    if (program) {
      this.techniques.push(new ShaderTechnique(this.device, {
        passes: [{
          program: program,
        }],
      }))
      this.technique = this.getTechnique(0)
    } else if (options.techniques) {
      for (let technique of makeArray(options.techniques)) {
        if (technique instanceof ShaderTechnique) {
          this.techniques.push(technique)
        } else {
          this.techniques.push(new ShaderTechnique(this.device, technique))
        }
      }
      this.technique = this.getTechnique(options.technique || 0)
    } else {
      throw new Error('ShaderEffect can not be created. techniques (and program) are missing')
    }
  }

  /**
   *
   */
  public useTechnique(techniqueIdentifier: number|string): ShaderEffect {
    this.technique = this.getTechnique(techniqueIdentifier)
    return this
  }

  /**
   * Gets a technique by name or index
   *
   * @remarks
   * Throws an error if no technique can be found
   */
  public getTechnique(techniqueIdentifier: string|number): ShaderTechnique {
    if (typeof techniqueIdentifier === 'number') {
      const result = this.techniques[techniqueIdentifier]
      if (result) {
        return result
      }
    }
    for (const tech of this.techniques) {
      if (tech.name === techniqueIdentifier) { return tech }
    }
    throw new Error(`Technique '${techniqueIdentifier}' not found`)
  }

  public pass(passIdentifier: string|number): ShaderPass {
    if (typeof passIdentifier === 'number') {
      let result = this.technique.passes[passIdentifier]
      if (result) { return result }
    }
    for (let pass of this.technique.passes) {
      if (pass.name === passIdentifier) { return pass }
    }
    throw new Error(`Pass '${passIdentifier}' not found`)
  }

  /**
   * Draws an object with the current technique
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }, parameters = this.parameters) {
    for (const pass of this.technique.passes) {
      pass.commit(parameters)
      drawable.draw(pass.program)
    }
  }

  /**
   * Returns a clone of this effect
   */
  public clone(): ShaderEffect {
    return new ShaderEffect(this.device, {
      name: this.name,
      parameters: copy(true, this.parameters),
      techniques: this.techniques.map((it) => it.clone()),
      technique: this.techniques.indexOf(this.technique),
    })
  }
}
