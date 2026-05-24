import { InputValueType, Program, ProgramInput, ProgramInputBlock, type ProgramOptions } from '../../resources'
import { Mutable } from '../types'
import type { WebglDevice } from '../WebglDevice'
import { WebglPendingInput, WebglProgramInput } from './WebglProgramInput'
import { hasUniformBlock } from './WebglReflection'
import type { WebglShaderModule } from './WebglShaderModule'
import type { WebglUniform } from './WebglUniform'
import { WebglUniformBlock } from './WebglUniformBlock'
import { WebglUniformBlockMember } from './WebglUniformBlockMember'
import { WebglUniformLocation } from './WebglUniformLocation'
import { WebglUniformSamplerBinding } from './WebglUniformSamplerBinding'

export class WebglProgram extends Program {
  public readonly module: WebglShaderModule
  public readonly sharedBlocks: ReadonlyArray<string>
  public readonly instanceBlocks: ReadonlyArray<string>
  public readonly perInstanceDataBlock: string | null
  public readonly perInstanceTransformBlock: string | null
  private device: WebglDevice

  // resources
  public readonly blocks: ReadonlyArray<WebglUniformBlock> = []
  public readonly locations: ReadonlyArray<WebglUniformLocation> = []
  public readonly sampler: ReadonlyArray<WebglUniformSamplerBinding> = []
  public readonly uniforms: Readonly<Record<string, WebglUniform>> = {}

  // input lookup table, created on the fly
  private inputs: Record<string, ProgramInput> = {}
  private sourceState: Record<string, { source: ProgramInputBlock; version: number }> = {}

  public constructor(program: WebglShaderModule, options?: ProgramOptions) {
    super()
    this.module = program
    this.device = program.device
    this.sharedBlocks = [...(options?.sharedBlocks || [])]
    this.perInstanceDataBlock = options?.perInstanceDataBlock ?? null
    this.perInstanceTransformBlock = options?.perInstanceTransformBlock ?? null
    this.module.onCompiled.add(this.createResources)
    this.module.onDisposed.add(() => this.dispose())
    if (this.module.isReady) {
      this.createResources()
    }
  }

  public applyBlock(block: ProgramInputBlock, force?: boolean): boolean {
    const state = this.sharedBlocks.includes(block.name) ? this.module.program.sourceState : this.sourceState
    state[block.name] ||= { source: block, version: -1 }
    const record = state[block.name]

    if (!force && record.source === block && record.version === block.version) {
      return false
    }

    record.source = block
    record.version = block.version
    this.applyInputs(block.values)

    return true
  }

  public applyInputs(values: Record<string, InputValueType>): void {
    for (const key in values) {
      this.set(key, values[key] as any)
    }
  }

  public get(input: string): ProgramInput | null {
    if (input in this.inputs) {
      return this.inputs[input]
    }
    if (this.module.isReady) {
      this.inputs[input] = createInput(input, this.uniforms) || null
    } else {
      this.inputs[input] = createPendingInput(input, this.module)
    }
    // if (!this.inputs[input]) {
    //   console.warn(`Uniform ${input} not found in program ${this.module.name}`)
    // }
    return this.inputs[input]
  }

  public set(path: string, value: InputValueType): boolean {
    const parameter = this.get(path as string)
    if (!parameter) {
      return false
    }
    parameter.set(value)
    return true
  }

  public commit(): void {
    for (const block of this.blocks) {
      block.commit()
    }
    for (const location of this.locations) {
      location.commit()
    }
  }

  public activate(): void {
    for (const binding of this.sampler) {
      const unit = this.device.textureUnits[binding.unit]
      unit?.update(binding.texture, binding.sampler)
    }
    for (const block of this.blocks) {
      const unit = this.device.uniformBlockUnits[block.index]
      unit?.update(block.boundBuffer)
    }
  }

  public dispose(): void {
    this.module.onCompiled.remove(this.createResources)
    for (const block of this.blocks) {
      if (!this.sharedBlocks.includes(block.name)) {
        block.dispose()
      }
    }
    const self = this as Mutable<this>
    self.locations = []
    self.uniforms = {}
    self.blocks = []
  }

  private createResources = () => {
    const self = this as Mutable<this>
    // blocks are the only ones that can be shared
    self.blocks = createBlocks(this.module, this.sharedBlocks)
    // legacy locations are always part of the program
    self.locations = createLocations(this.module)
    self.uniforms = createUniforms({
      module: this.module,
      shared: this.sharedBlocks,
      blocks: this.blocks,
      locations: this.locations,
    })
    self.sampler = Object.values(self.uniforms).filter((it) => it.type === 'sampler') as WebglUniformSamplerBinding[]
    this.inputs = convertPendingInputs(this.inputs, this.uniforms)
  }

  public clone(options?: ProgramOptions): WebglProgram {
    return new WebglProgram(this.module, {
      sharedBlocks: options?.sharedBlocks ?? this.sharedBlocks,
      perInstanceDataBlock: options?.perInstanceDataBlock ?? this.perInstanceDataBlock,
      perInstanceTransformBlock: options?.perInstanceTransformBlock ?? this.perInstanceTransformBlock,
    })
  }
}

function createBlocks(module: WebglShaderModule, shared: ReadonlyArray<string>): WebglUniformBlock[] {
  const root = module.program
  return module.reflection.blocks.map((info) => {
    const isShared = shared.includes((info.block || info.name).toLowerCase())
    const instance = root?.blocks?.find((b) => b.name === info.name)
    if (instance && isShared) {
      return instance
    }
    if (instance) {
      return instance.clone()
    }
    return new WebglUniformBlock(module, info.name, info.index, info.size)
  })
}

function createLocations(module: WebglShaderModule): WebglUniformLocation[] {
  const root = module.program
  const result: WebglUniformLocation[] = []
  for (const info of module.reflection.uniforms) {
    if (hasUniformBlock(info)) {
      continue
    }
    const instance = root?.locations?.find((loc) => loc.name === info.name)
    if (instance) {
      result.push(instance)
    } else {
      result.push(new WebglUniformLocation(module, info))
    }
  }
  return result
}

function createUniforms({
  module,
  shared,
  blocks,
  locations,
}: {
  module: WebglShaderModule
  shared: ReadonlyArray<string>
  blocks: ReadonlyArray<WebglUniformBlock>
  locations: ReadonlyArray<WebglUniformLocation>
}): Record<string, WebglUniform> {
  const result: Record<string, WebglUniform> = {}
  const root = module.program
  for (const info of module.reflection.uniforms) {
    let uniform: WebglUniform | null = null
    if (hasUniformBlock(info)) {
      const block = blocks.find((b) => b.index === info.blockIndex)
      uniform = new WebglUniformBlockMember(block, info)
    } else if (info.type.container === 'sampler') {
      const isShared = shared.includes(info.name)
      const instance = root?.sampler?.find((s) => s.name === info.name)
      if (instance && isShared) {
        uniform = instance
      } else {
        uniform = new WebglUniformSamplerBinding(module, info)
      }
    } else {
      uniform = locations.find((loc) => loc.name === info.name)
    }

    if (uniform) {
      addUniform(result, uniform)
    }
  }
  return result
}

function addUniform(uniforms: Record<string, WebglUniform>, uniform: WebglUniform) {
  // prefer aliases over names, since they are explicitly defined by the user
  // as access names for the uniforms
  const alias = (uniform.alias || uniform.name).toLowerCase()
  if (alias in uniforms) {
    console.warn(`Duplicate uniform alias ${alias} for uniform ${uniform.name}`)
  } else {
    uniforms[alias] = uniform
  }
  const name = uniform.name.toLowerCase()
  if (name === alias) {
    return
  }
  if (name in uniforms) {
    console.warn(`Duplicate uniform name ${name} for uniform ${uniform.name}`)
  } else {
    uniforms[name] = uniform
  }
}

function createInput(name: string, uniforms: Record<string, WebglUniform>): WebglProgramInput | null {
  const lowerName = name.toLowerCase()
  if (lowerName in uniforms) {
    return new WebglProgramInput(uniforms[lowerName], name, 0)
  }
  const arrayIndex = Number(name.match(/\[(\d+)\]$/)?.[1] || 0)
  const basePath = name.replace(/\[\d+\]$/, '')
  const atIndex0 = `${basePath}[0]`.toLowerCase()
  if (atIndex0 in uniforms) {
    return new WebglProgramInput(uniforms[atIndex0], `${basePath}[${arrayIndex}]`, arrayIndex)
  }
  return null
}

function convertPendingInputs(inputs: Record<string, ProgramInput>, uniforms: Record<string, WebglUniform>) {
  const result: Record<string, ProgramInput> = {}
  for (const key in inputs) {
    const pending = inputs[key]
    if (!(pending instanceof WebglPendingInput)) {
      continue
    }
    const input = createInput(key, uniforms)
    if (!input) {
      continue
    }
    try {
      pending.apply(input)
      result[key] = input
    } catch (e) {
      console.warn(`Failed to apply pending input for ${key}`, e)
    }
  }
  return result
}
function createPendingInput(input: string, module: WebglShaderModule): ProgramInput {
  return new WebglPendingInput(input, module)
}
