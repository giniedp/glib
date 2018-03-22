import { copy } from '@gglib/core'

import { ShaderProgram, ShaderProgramOptions } from './ShaderProgram'
import { ShaderTechnique, ShaderTechniqueOptions } from './ShaderTechnique'

import { Device } from './Device'
import { ModelMesh } from './ModelMesh'
import { ShaderPass } from './ShaderPass'

/**
 * @public
 */
export interface ShaderEffectOptions {
  /**
   * The name of an effect
   */
  name?: string
  /**
   * The parameter set of an effect
   */
  parameters?: any
  /**
   * A program (or constructor options) for an effect
   */
  program?: ShaderProgram|ShaderProgramOptions
  /**
   * A collection of programs of an effect
   */
  techniques?: Array<ShaderTechniqueOptions|ShaderTechnique>|ShaderTechnique
  /**
   * The name or index of the default technique of an effect
   */
  technique?: string|number
}

function makeArray(arg: any): any {
  if (Array.isArray(arg)) {
    return arg
  } else if (arg) {
    return [arg]
  } else {
    return []
  }
}

/**
 * @public
 */
export class ShaderEffect {
  /**
   * The name of the effect
   */
  public name: string
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The effect parameters
   */
  public parameters: { [key: string]: any }
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
  constructor(device: Device, options: ShaderEffectOptions) {
    this.device = device
    this.name = options.name
    this.parameters = options.parameters || {}
    this.techniques = []

    let techniques = makeArray(options.techniques)
    if (options.program) {
      techniques.push({
        name: 'TECHNIQUE' + techniques.length,
        passes: [{ program: options.program }],
      })
    }
    for (let technique of techniques) {
      if (technique instanceof ShaderTechnique) {
        this.techniques.push(technique)
      } else {
        this.techniques.push(new ShaderTechnique(device, technique))
      }
    }

    this.technique = this.getTechnique(options.technique || 0)
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
   */
  public getTechnique(techniqueIdentifier: string|number): ShaderTechnique {
    if (typeof techniqueIdentifier === 'number') {
      let result = this.techniques[techniqueIdentifier]
      if (result) { return result }
    }
    for (let tech of this.techniques) {
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
  public draw(item: { draw: (p: ShaderProgram) => void|any }) {
    for (const pass of this.technique.passes) {
      pass.commit(this.parameters)
      item.draw(pass.program)
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
