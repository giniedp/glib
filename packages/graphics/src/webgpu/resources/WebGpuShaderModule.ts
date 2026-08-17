import {
  getRefCounter,
  ShaderModule,
  VertexBuffer,
  type ReferenceCounted,
  type ReferenceCounter,
  type VertexAttribute,
} from '../../resources'
import { ShaderConstants } from '../../states'
import type { GpuResource, Mutable } from '../types'
import type { WebGpuDevice } from '../WebGpuDevice'
import { parseWgsl, reflectWgsl, WgslEntryPointInfo, WgslProgramInfo, type WgslInputInfo } from '../wgsl'
import { WebGpuBuffer } from './WebGpuBuffer'
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
}

export class WebGpuShaderModule extends ShaderModule implements GpuResource<GPUShaderModule>, ReferenceCounted {
  /**
   * The graphics device
   */
  public readonly device: WebGpuDevice
  /**
   * The shader source code
   */
  public readonly source: string
  /**
   * The compiled GPU shader module handle
   */
  public readonly gpuObject: GPUShaderModule
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

  public readonly ref: ReferenceCounter

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
    this.gpuObject = device.gpu.createShaderModule({
      label: options.name,
      code: options.code,
    })

    this.ref = getRefCounter(options) || null
    if (this.ref) {
      this.ref.retain()
      this.ref.onFinalize(() => this.finalize())
    }

    this.isCompiled = false
    this.compiled = this.gpuObject.getCompilationInfo().then((info) => {
      logCompilationInfo(info, this.source)
      const self = this as Mutable<this>
      self.isCompiled = true
      self.isValid = !info.messages.some((it) => it.type === 'error')
      return this
    })

    this.info = reflectWgsl(parseWgsl(this.source))
    this.vertexEntry = this.info.entryPoints.find((it) => it.stage === 'vertex')
    this.fragmentEntry = this.info.entryPoints.find((it) => it.stage === 'fragment')
    this.computeEntry = this.info.entryPoints.find((it) => it.stage === 'compute')
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

  private vertexLayoutCache = new WeakMap<VertexBuffer, GPUVertexBufferLayout[]>()
  public getVertexLayout(vertexBuffer: VertexBuffer): GPUVertexBufferLayout[] {
    if (this.vertexLayoutCache.has(vertexBuffer)) {
      return this.vertexLayoutCache.get(vertexBuffer)
    }
    const result: GPUVertexBufferLayout[] = []

    this.vertexLayoutCache.set(vertexBuffer, result)
    if (!this.vertexEntry) {
      return result
    }

    const inputs: Record<string, WgslInputInfo> = {}
    for (const input of this.vertexEntry.inputs) {
      inputs[input.alias || input.name] = input
    }

    const vertexCount = vertexBuffer.getMaxVertexCount()
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

    if (Object.keys(inputs).length > 0) {
      for (const semantic in inputs) {
        const input = inputs[semantic]
        const isColor = semantic.match(/color/i)
        const data = isColor ? [1, 1, 1, 1] : [0, 0, 0, 0]
        const buffer = new WebGpuBuffer(this.device, {
          type: 'VertexBuffer',
          name: `auto-generated vertex buffer for shader input '${semantic}'`,
          vertexLayout: {
            [semantic]: {
              byteOffset: 0,
              elementType: input.elementType,
              elementCount: input.elementCount,
            },
          },
          data: new Float32Array(data),
          // to make this default vertex be used even in instanced mode
          // we mark it as instanced, so it works for single draw single instance
          // we set explicitly stride=0, so with instancing, it should always read from the same location
          instanced: true,
          stride: 0,
        })
        vertexBuffer.buffers.push(buffer)
      }
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
          format: getGPUVertexFormat(layout),
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

    return result
  }

  public dispose(): void {
    if (this.ref) {
      this.ref.release()
    } else {
      this.finalize()
    }
  }

  private finalize(): void {
    const self = this as Mutable<this>
    self.gpuObject = null
    self.program.dispose()
    self.program = null
  }
}

function getInputBySemanticOrName(entry: WgslEntryPointInfo, name: string) {
  for (const input of entry.inputs) {
    if (input.alias === name || input.name === name) {
      return input
    }
  }
  return null
}

function getGPUVertexFormat(attribute: VertexAttribute): GPUVertexFormat {
  const type = getGpuAttributeElementType(attribute)
  const count = attribute.elementCount
  switch (type) {
    case 'float32':
    case 'sint32':
    case 'uint32': {
      if (count === 1) {
        return type
      }
      if (count <= 4) {
        return `${type}x${count as 2 | 3 | 4}`
      }
      throw new Error(`expected element count to be in range [1-4] but was ${count}`)
    }
    case 'float16':
    case 'uint16':
    case 'sint16':
    case 'unorm16':
    case 'snorm16':
    case 'uint8':
    case 'sint8':
    case 'unorm8':
    case 'snorm8': {
      if (count === 1) {
        return type
      }
      if (count === 2 || count === 4) {
        return `${type}x${count}`
      }
      throw new Error(`expected element count to be in range [1-4] but was ${count}`)
    }
  }
}

function getGpuAttributeElementType(attribute: VertexAttribute) {
  switch (attribute.elementType) {
    case 'float32':
    case 'float16':
      if (attribute.normalized) {
        throw new Error(`'normalize' is not supported for attribute type '${attribute.elementType}'`)
      }
      return attribute.elementType
    case 'int8':
      return attribute.normalized ? 'snorm8' : (`s${attribute.elementType}` as const)
    case 'int16':
      return attribute.normalized ? 'snorm16' : (`s${attribute.elementType}` as const)
    case 'int32':
      if (attribute.normalized) {
        throw new Error(`'normalize' is not supported for attribute type '${attribute.elementType}'`)
      }
      return `s${attribute.elementType}` as const
    case 'uint8':
      return attribute.normalized ? 'unorm8' : attribute.elementType
    case 'uint16':
      return attribute.normalized ? 'unorm16' : attribute.elementType
    case 'uint32':
      if (attribute.normalized) {
        throw new Error(`'normalize' is not supported for attribute type '${attribute.elementType}'`)
      }
      return attribute.elementType
  }
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
