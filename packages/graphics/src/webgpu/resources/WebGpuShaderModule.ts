import { vertexTypeFromDataFormat } from '../../enums'
import { ResourceOwnership, ShaderModule, VertexBuffer } from '../../resources'
import { ShaderConstants } from '../../states'
import type { GpuResource, Mutable } from '../types'
import type { WebGpuDevice } from '../WebGpuDevice'
import {
  parseWgsl,
  reflectWgsl,
  WgslEntryPointInfo,
  WgslProgramInfo,
  type WgslInputInfo,
  type WgslShaderStage,
} from '../wgsl'
import { WebGpuProgram } from './WebGpuProgram'

export interface WebGpuShaderOptions {
  /**
   * The descriptive name of this shader module
   */
  name?: string
  /**
   * The shader source code.
   */
  code: string
  /**
   * The constants used to configure the vertex shader stage of this shader module.
   */
  vertexConstants?: ShaderConstants
  /**
   * The constants used to configure the fragment shader stage of this shader module.
   */
  fragmentConstants?: ShaderConstants
  /**
   * The constants used to configure the fragment shader stage of this shader module.
   */
  computeConstants?: ShaderConstants
  /**
   * Name of the vertex entry point. Defaults to the first `@vertex` function.
   */
  vertexEntry?: string
  /**
   * Name of the fragment entry point. Defaults to the first `@fragment` function.
   */
  fragmentEntry?: string
  /**
   * Name of the compute entry point. Defaults to the first `@compute` function.
   */
  computeEntry?: string
}

export class WebGpuShaderModule extends ShaderModule implements GpuResource<GPUShaderModule> {
  /**
   * The graphics device
   */
  public readonly device: WebGpuDevice
  /**
   * The shader source code
   */
  public readonly source: string
  /**
   * The descriptive name of this shader module
   */
  public readonly name: string
  /**
   * The GPU shader module handle. Created on access and released after {@link GPU_MODULE_IDLE_MS} without access.
   *
   * @remarks
   * Chrome charges ~100 bytes of V8 external memory per source character to every live `GPUShaderModule`.
   * Large shaders with many variants exhaust V8's global GC limit and cause long GC pauses. Pipelines don't need
   * the module after creation, so only pipeline creation accesses it, and a recreated module hits the browser's
   * shader cache.
   */
  public get gpuObject(): GPUShaderModule {
    if (!this.gpuModule && !this.isFinalized) {
      this.gpuModule = this.device.gpu.createShaderModule({ label: this.name, code: this.source })
    }
    this.lastAccess = performance.now()
    if (!this.releaseTimer && this.gpuModule) {
      this.releaseTimer = setTimeout(this.releaseIfIdle, GPU_MODULE_IDLE_MS)
    }
    return this.gpuModule
  }
  private gpuModule: GPUShaderModule | null = null
  private isFinalized = false
  private lastAccess = 0
  private releaseTimer: ReturnType<typeof setTimeout> | null = null
  private releaseIfIdle = () => {
    const idle = performance.now() - this.lastAccess
    if (idle < GPU_MODULE_IDLE_MS) {
      this.releaseTimer = setTimeout(this.releaseIfIdle, GPU_MODULE_IDLE_MS - idle)
    } else {
      this.releaseTimer = null
      this.gpuModule = null
    }
  }
  /**
   * The default program bindings for this shader module.
   */
  public readonly program: WebGpuProgram

  public readonly compiled: Promise<this>
  public readonly isCompiled: boolean = false
  public readonly isValid: boolean = false

  /**
   * The constants used to configure the vertex shader stage of this shader module.
   */
  public readonly vertexConstants: ShaderConstants | null
  /**
   * The constants used to configure the fragment shader stage of this shader module.
   */
  public readonly fragmentConstants: ShaderConstants | null
  /**
   * The constants used to configure the fragment shader stage of this shader module.
   */
  public readonly computeConstants: ShaderConstants | null

  public readonly ownership: ResourceOwnership

  private info: WgslProgramInfo
  private vertexEntry: WgslEntryPointInfo
  private fragmentEntry: WgslEntryPointInfo
  private computeEntry: WgslEntryPointInfo

  public pipelineLayout: GPUPipelineLayout

  public get vertexFn() {
    return this.vertexEntry?.name
  }
  public get fragmentFn() {
    return this.fragmentEntry?.name
  }
  public get computeFn() {
    return this.computeEntry?.name
  }

  public constructor(device: WebGpuDevice, options: WebGpuShaderOptions) {
    super()
    this.device = device
    this.source = options.code
    if (!this.source) {
      throw new Error(`Wgsl source code missing: ${options.name}`)
    }
    this.vertexConstants = options.vertexConstants
    this.fragmentConstants = options.fragmentConstants
    this.computeConstants = options.computeConstants
    this.name = options.name

    this.ownership = new ResourceOwnership(this)
    this.ownership.onFinalize(() => this.finalize())

    this.isCompiled = false
    this.compiled = this.gpuObject.getCompilationInfo().then((info) => {
      logCompilationInfo(info, this.source)
      const self = this as Mutable<this>
      self.isCompiled = true
      self.isValid = !info.messages.some((it) => it.type === 'error')
      return this
    })

    this.info = reflectWgsl(parseWgsl(this.source))
    this.vertexEntry = findEntryPoint(this.info, 'vertex', options.vertexEntry, options.name)
    this.fragmentEntry = findEntryPoint(this.info, 'fragment', options.fragmentEntry, options.name)
    this.computeEntry = findEntryPoint(this.info, 'compute', options.computeEntry, options.name)
    this.program = new WebGpuProgram(this, this.info)
    this.pipelineLayout = this.device.gpu.createPipelineLayout({
      bindGroupLayouts: this.program.bindGroupLayouts,
    })
  }

  public getMaxOutputLocation() {
    let maxLocation = -1
    if (this.fragmentEntry) {
      for (const output of this.fragmentEntry.outputs) {
        if (output.location != null && output.location > maxLocation) {
          maxLocation = output.location
        }
      }
    }
    return maxLocation
  }

  private outputLocationMask: number = null
  /**
   * Bit mask of the color locations the fragment entry point writes, bit `i` is set for `@location(i)`.
   * Zero without a fragment entry point or without color outputs.
   *
   * @remarks
   * A pipeline needs one color target per attachment of its pass. Targets the shader does not write must have a
   * zero write mask, this mask tells which ones.
   */
  public getOutputLocationMask() {
    if (this.outputLocationMask === null) {
      let mask = 0
      for (const output of this.fragmentEntry?.outputs ?? []) {
        if (output.location != null) {
          mask |= 1 << output.location
        }
      }
      this.outputLocationMask = mask
    }
    return this.outputLocationMask
  }

  private vertexLayoutByID = new Map<string, GPUVertexBufferLayout[]>()
  private vertexLayoutByBuffer = new WeakMap<VertexBuffer, GPUVertexBufferLayout[]>()
  public getVertexLayout(vertexBuffer: VertexBuffer): GPUVertexBufferLayout[] {
    if (this.vertexLayoutByBuffer.has(vertexBuffer)) {
      return this.vertexLayoutByBuffer.get(vertexBuffer)
    }
    const result: GPUVertexBufferLayout[] = []

    this.vertexLayoutByBuffer.set(vertexBuffer, result)
    if (!this.vertexEntry) {
      return result
    }

    const inputs: Record<string, WgslInputInfo> = {}
    for (const input of this.vertexEntry.inputs) {
      inputs[input.alias || input.name] = input
    }

    const available: string[] = []
    for (const buffer of vertexBuffer.buffers) {
      for (const semantic in buffer.vertexLayout) {
        available.push(semantic)
        const input = getInputBySemanticOrName(this.vertexEntry, semantic)
        if (input) {
          delete inputs[input.alias || input.name]
        }
      }
    }

    // inputs the mesh does not provide read a shared default element (zero, white for colors)
    for (const semantic in inputs) {
      vertexBuffer.buffers.push(
        this.device.getDefaultVertexBuffer(semantic, vertexTypeFromDataFormat(inputs[semantic])),
      )
    }

    for (const buffer of vertexBuffer.buffers) {
      const attributes: GPUVertexAttribute[] = []
      for (const semantic in buffer.vertexLayout) {
        const input = getInputBySemanticOrName(this.vertexEntry, semantic)
        if (!input) {
          continue
        }
        const layout = buffer.vertexLayout[semantic]
        attributes.push({
          format: layout.type,
          offset: layout.byteOffset,
          shaderLocation: input.location,
        })
        delete inputs[input.alias || input.name]
      }
      result.push({
        arrayStride: buffer.stride,
        attributes,
        stepMode: buffer.instanced ? 'instance' : 'vertex',
      })
    }

    const vertexLayoutID = JSON.stringify(result)
    let interned = this.vertexLayoutByID.get(vertexLayoutID)
    if (!interned) {
      interned = result
      this.vertexLayoutByID.set(vertexLayoutID, interned)
    }
    this.vertexLayoutByBuffer.set(vertexBuffer, interned)
    return interned
  }

  public dispose(): void {
    this.ownership.finalize()
  }

  private finalize(): void {
    const self = this as Mutable<this>
    clearTimeout(this.releaseTimer)
    this.releaseTimer = null
    this.gpuModule = null
    this.isFinalized = true
    self.program.dispose()
    self.program = null
  }
}

/**
 * Finds the entry point of a stage by name, or the first one of that stage when no name is given
 */
/**
 * Time without access after which a {@link WebGpuShaderModule} releases its `GPUShaderModule`
 */
export const GPU_MODULE_IDLE_MS = 5000

function findEntryPoint(
  info: WgslProgramInfo,
  stage: WgslShaderStage,
  name: string | undefined,
  moduleName: string | undefined,
): WgslEntryPointInfo | undefined {
  if (!name) {
    return info.entryPoints.find((it) => it.stage === stage)
  }
  const entry = info.entryPoints.find((it) => it.stage === stage && it.name === name)
  if (!entry) {
    throw new Error(`${stage} entry point '${name}' not found in shader module '${moduleName ?? ''}'`)
  }
  return entry
}

function getInputBySemanticOrName(entry: WgslEntryPointInfo, name: string) {
  for (const input of entry.inputs) {
    if (input.alias === name || input.name === name) {
      return input
    }
  }
  return null
}

function logCompilationInfo(info: GPUCompilationInfo, source: string) {
  const lines = source.split('\n')
  for (const message of info.messages) {
    switch (message.type) {
      case 'error':
        console.error(formatMessage(message, lines))
        break
      case 'warning':
        console.warn(formatMessage(message, lines))
        break
      case 'info':
        console.info(formatMessage(message, lines))
        break
    }
  }
}

function formatMessage(message: GPUCompilationMessage, lines: string[], n = 10) {
  const result: string[] = [`${message.type.toUpperCase()}: ${message.message}`]
  const lineNum = message.lineNum - 1
  for (let i = lineNum - n; i < lineNum + n; i++) {
    if (i < 0 || i >= lines.length) {
      continue
    }

    if (i !== lineNum) {
      result.push(`${String(i).padStart(5)}:  ${lines[i]}`)
    } else {
      result.push(`>${String(i).padStart(4)}:  ${lines[i]}`)
      result.push(`      ${' '.repeat(message.linePos + 1)}^`)
    }
  }
  return result.join('\n')
}
