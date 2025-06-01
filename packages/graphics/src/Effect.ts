import { copy } from '@gglib/utils'
import { Device } from './Device'
import { EffectPass } from './EffectPass'
import { EffectTechnique, EffectTechniqueOptions } from './EffectTechnique'
import { ShaderProgram, ShaderProgramOptions, ShaderUniformValue } from './resources'
import { BlendState } from './states'

/**
 * Constructor options for {@link Effect}
 *
 * @public
 */
export type EffectOptions = EffectOptionsWithTechnique | EffectOptionsWithProgram

export interface EffectOptionsBase {
  /**
   * A user defined name of the effect
   */
  name?: string

  /**
   * User defined meta data and annotations
   */
  meta?: Record<string, any>
}
/**
 * Constructor options for {@link Effect}
 *
 * @public
 */
export interface EffectOptionsWithTechnique extends EffectOptionsBase {
  /**
   * A collection of programs of this effect
   *
   * @remarks
   * `techniques` option is mutually exclusive with `program` option
   */
  techniques?: EffectTechniqueOptions[]

  /**
   * The name or index of the default technique of an effect. Defaults to `0`
   */
  technique?: string | number
}

/**
 * Constructor options for {@link Effect}
 *
 * @public
 */
export interface EffectOptionsWithProgram extends EffectOptionsBase {
  /**
   * The program to be used on this effect
   *
   * @remarks
   * `program` option is mutually exclusive with `techniques` option.
   * If this is given, then `techniques` and `technique` options are ignored and
   * instead created from this single program
   */
  program?: ShaderProgramOptions
}

/**
 * @public
 */
export type EffectParameters = Record<string, ShaderUniformValue>

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
 * Collection of multiple shader techniques
 *
 * @public
 * @see {@link EffectTechnique}
 * @remarks
 * This is loosely modeled after the Direct3D effect framework.
 *
 * An effect is a collection of shader techniques and programs.
 * It can be used to encapsulate a set of rendering techniques that can be switched at runtime.
 */
export class Effect {
  /**
   * The graphics device
   */
  public device: Device

  /**
   * A user defined name of the effect
   */
  public name: string

  /**
   * User defined meta data and annotations
   */
  public meta?: Record<string, any>

  /**
   * The technique collection
   */
  public techniques: EffectTechnique[] = []

  /**
   * The technique that is currently active
   */
  public technique: EffectTechnique

  /**
   * Shorthand to access the first technique
   *
   * @remarks
   * Useful when working with single technique effects
   */
  public get technique0() {
    return this.techniques[0]
  }

  /**
   * Shorthand to access the first pass of the first technique
   *
   * @remarks
   * Useful when working with single pass effects
   */
  public get pass0() {
    return this.technique0.pass0
  }

  /**
   * Shorthand to access the first program of the first technique
   *
   * @remarks
   * Useful when working with single program effects
   */
  public get program0() {
    return this.technique0.program0
  }

  private techniqueIndex = new Map<string, EffectTechnique>()

  constructor(device: Device, options?: EffectOptions) {
    this.device = device
    if (options) {
      this.reset(options)
    }
  }

  /**
   * Allows to re-create the effect
   */
  public reset(options: EffectOptions) {
    this.name = options.name || ''
    this.meta = options.meta || {}
    this.techniques.length = 0

    if ('program' in options) {
      disposeTechniques(this.techniques)
      this.techniques = createTechniquesFromProgram(this.device, options)
      this.technique = this.techniques[0]
    } else if ('techniques' in options) {
      disposeTechniques(this.techniques)
      this.techniques = createTechniques(this.device, options)
      this.technique = this.getTechnique(options.technique || 0)
    }

    if (!this.technique) {
      throw new Error('ShaderEffect can not be created. techniques (and program) are missing')
    }
    this.indexTechniques()
  }

  protected indexTechniques() {
    this.techniqueIndex.clear()
    for (const technique of this.techniques) {
      if (technique.name) {
        this.techniqueIndex.set(technique.name, technique)
      }
    }
  }

  /**
   * Switches to another technique identified by given name or index
   */
  public useTechnique(nameOrIndex: number | string): this {
    this.technique = this.getTechnique(nameOrIndex)
    return this
  }

  /**
   * Gets a technique by name or index
   *
   * @remarks
   * Throws an error if no technique can be found
   */
  public getTechnique(nameOrIndex: string | number): EffectTechnique {
    let result: EffectTechnique
    if (typeof nameOrIndex === 'number') {
      result = this.techniques[nameOrIndex]
    } else {
      result = this.techniqueIndex.get(nameOrIndex)
    }
    if (!result) {
      throw new Error(`Technique '${nameOrIndex}' not found`)
    }
    return result
  }

  /**
   * Gets a pass by name or index from the currently active {@link Effect.technique}
   */
  public pass(passIdentifier: string | number): EffectPass {
    return this.technique.pass(passIdentifier)
  }

  /**
   * Calls `draw` on given object for each {@link EffectPass} of the current {@link Effect.technique}
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }, parameters: EffectParameters) {
    for (const pass of this.technique.passes) {
      pass.commit(parameters)
      drawable.draw(pass.program)
    }
  }

  /**
   * Draws a full screen quad with the current {@link Effect.technique} and fiven parameters
   */
  public drawQuad(parameters?: EffectParameters, flipY = false) {
    for (const pass of this.technique.passes) {
      pass.commit(parameters)
      this.device.program = pass.program
      this.device.drawQuad(flipY)
    }
  }

  /**
   * Creates a clone of this effect
   */
  public clone(): Effect {
    return new Effect(this.device, {
      name: this.name,
      meta: { ...(this.meta || {}) },
      techniques: this.techniques.map((it) => it.clone()),
      technique: this.techniques.indexOf(this.technique),
    })
  }

  /**
   * Checks if all techniques are ready
   *
   * @remarks
   * If no techniques are defined, this will return true
   */
  public isReady() {
    if (!this.techniques?.length) {
      return true
    }
    for (const technique of this.techniques) {
      if (!technique.isReady()) {
        return false
      }
    }
    return true
  }

  public dispose() {
    if (this.techniques) {
      for (const technique of this.techniques) {
        technique.dispose()
      }
    }
    this.techniques = []
    this.techniqueIndex.clear()
    this.device = null
  }
}

function createTechniquesFromProgram(device: Device, options: EffectOptionsWithProgram): EffectTechnique[] {
  let program: ShaderProgram
  if (options.program instanceof ShaderProgram) {
    program = options.program
  } else if (options.program) {
    program = device.createProgram(options.program)
  }
  if (!program) {
    return []
  }
  return [
    new EffectTechnique(device, {
      passes: [
        {
          program: program,
        },
      ],
    }),
  ]
}

function createTechniques(device: Device, options: EffectOptionsWithTechnique): EffectTechnique[] {
  const techniques: EffectTechnique[] = []
  for (let technique of makeArray(options.techniques)) {
    if (technique instanceof EffectTechnique) {
      techniques.push(technique)
    } else {
      techniques.push(new EffectTechnique(device, technique))
    }
  }
  return techniques
}

function disposeTechniques(techniques: EffectTechnique[]) {
  if (!techniques) {
    return
  }
  for (const technique of techniques) {
    technique.dispose()
  }
}
