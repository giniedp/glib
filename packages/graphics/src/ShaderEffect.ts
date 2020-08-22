import { copy, TypeToken } from '@gglib/utils'

import { ShaderTechnique, ShaderTechniqueOptions } from './ShaderTechnique'

import { Device } from './Device'
import { ShaderProgram, ShaderProgramOptions, ShaderUniformValue } from './resources'
import { ShaderPass } from './ShaderPass'

/**
 * Constructor options for {@link ShaderEffect}
 *
 * @public
 */
export interface ShaderEffectOptions {
  /**
   * A user defined name of the effect
   */
  name?: string
  /**
   * The default set of parameters
   */
  parameters?: { [key: string]: ShaderUniformValue }
  /**
   * A collection of programs of this effect
   *
   * @remarks
   * `techniques` option is mutually exclusive with `program` option
   */
  techniques?: ReadonlyArray<ShaderTechniqueOptions | ShaderTechnique> | ShaderTechnique
  /**
   * The name or index of the default technique of an effect. Defaults to `0`
   */
  technique?: string | number

  /**
   * The program to be used on this effect
   *
   * @remarks
   * `program` option is mutually exclusive with `techniques` option.
   * If this is given, then `techniques` and `technique` options are ignored and
   * instead created from this single program
   */
  program?: ShaderProgram | ShaderProgramOptions
}

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
 * Defines a collection of {@link ShaderTechnique}s.
 *
 * @public
 * @remarks
 * Holds one active {@link ShaderTechnique}
 * A shader effect can hold several shader programs
 * There is only one active technique at a time which can be switched via `useTechnique`.
 */
export class ShaderEffect {
  /**
   * A symbol identifying the Array {@link ShaderEffect} type.
   */
  public static readonly Array = new TypeToken<ShaderEffect[]>('ShaderEffect[]', {
    factory: () => {
      return []
    },
  })

  /**
   * A symbol identifying the {@link ShaderEffectOptions} type.
   */
  public static readonly Options = new TypeToken<ShaderEffectOptions>('ShaderEffectOptions', {
    factory: () => {
      return {}
    },
  })

  /**
   * A symbol identifying the Array {@link ShaderEffectOptions} type.
   */
  public static readonly OptionsArray = new TypeToken<ShaderEffectOptions[]>('ShaderEffectOptions[]', {
    factory: () => {
      return []
    },
  })

  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * A user defined name of the effect
   */
  public readonly name: string
  /**
   * The effect parameters that have been specified for this effect
   *
   * @remarks
   * When using {@link ShaderEffect.draw} these parameters are used as defaults but can be overridden
   */
  public readonly parameters: { [key: string]: ShaderUniformValue }
  /**
   * The technique collection
   */
  public readonly techniques: ReadonlyArray<ShaderTechnique> = []
  /**
   * The technique that is currently active
   */
  public readonly technique: ShaderTechnique

  private readonly techniquesByName = new Map<string, ShaderTechnique>()

  constructor(device: Device, options?: ShaderEffectOptions) {
    this.device = device
    if (options) {
      this.setup(options)
    }
  }

  /**
   * Allows to re-initialize the shader effect
   *
   * @param options - The options for initialization
   */
  public setup(options: ShaderEffectOptions) {
    ;(this as { name: string }).name = options.name
    ;(this as { parameters: any }).parameters = options.parameters || {}

    const techniques = this.techniques as ShaderTechnique[]
    techniques.length = 0

    let program: ShaderProgram
    if (options.program instanceof ShaderProgram) {
      program = options.program
    } else if (options.program) {
      program = this.device.createProgram(options.program)
    }
    if (program) {
      techniques.push(
        new ShaderTechnique(this.device, {
          passes: [
            {
              program: program,
            },
          ],
        }),
      )
      ;(this as { technique: ShaderTechnique }).technique = this.getTechnique(0)
    } else if (options.techniques) {
      for (let technique of makeArray(options.techniques)) {
        if (technique instanceof ShaderTechnique) {
          techniques.push(technique)
        } else {
          techniques.push(new ShaderTechnique(this.device, technique))
        }
      }
      ;(this as { technique: ShaderTechnique }).technique = this.getTechnique(options.technique || 0)
    } else {
      throw new Error('ShaderEffect can not be created. techniques (and program) are missing')
    }
    this.techniquesByName.clear()
    for (const technique of this.techniques) {
      if (technique.name) {
        this.techniquesByName.set(technique.name, technique)
      }
    }
  }

  /**
   * Switches to another technique identified by given name or index
   */
  public useTechnique(nameOrIndex: number | string): this {
    ;(this as { technique: ShaderTechnique }).technique = this.getTechnique(nameOrIndex)
    return this
  }

  /**
   * Gets a technique by name or index
   *
   * @remarks
   * Throws an error if no technique can be found
   */
  public getTechnique(nameOrIndex: string | number): ShaderTechnique {
    let result: ShaderTechnique
    if (typeof nameOrIndex === 'number') {
      result = this.techniques[nameOrIndex]
    } else {
      result = this.techniquesByName.get(nameOrIndex)
    }
    if (!result) {
      throw new Error(`Technique '${nameOrIndex}' not found`)
    }
    return result
  }

  /**
   * Gets a pass by name or index from the currently active {@link ShaderEffect.technique}
   */
  public pass(passIdentifier: string | number): ShaderPass {
    return this.technique.pass(passIdentifier)
  }

  /**
   * Calls `draw` on given object for each {@link ShaderPass} of the current {@link ShaderEffect.technique}
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }, parameters = this.parameters) {
    for (const pass of this.technique.passes) {
      pass.commit(parameters)
      drawable.draw(pass.program)
    }
  }

  /**
   * Creates a clone of this effect
   */
  public clone(): ShaderEffect {
    return new ShaderEffect(this.device, {
      name: this.name,
      parameters: copy(true, this.parameters),
      techniques: this.techniques.map((it) => it.clone()),
      technique: this.techniques.indexOf(this.technique),
    })
  }

  /**
   * Gets a shader parameter by name
   *
   * @remarks
   * This simply gets the parameter from {@link ShaderEffect.parameters} by its name.
   * The method exists to allow type assertion on the returned value in typescript e.g.
   *
   * ```ts
   * getParameter<Mat4>('World').setTranslation(...)
   * ```
   *
   * @param name - The name of the parameter
   */
  public getParameter<T extends ShaderUniformValue>(name: string): T | null {
    return this.parameters[name] as T
  }
}
