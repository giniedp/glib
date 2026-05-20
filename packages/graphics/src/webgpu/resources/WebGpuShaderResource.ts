import { SamplerState } from '../../states'
import { ShaderAnnotations } from '../../shader'
import type { WebGpuDevice } from '../WebGpuDevice'
import type { WgslResourceInfo, WgslTextureInfo } from '../wgsl'

const RENDER_VISIBILITY = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT
const COMPUTE_VISIBILITY = GPUShaderStage.COMPUTE

export type WebGpuShaderResourceHandler = (resource: WebGpuShaderResource) => void
export class WebGpuShaderResource {
  public readonly device: WebGpuDevice

  /**
   * The data that will be uploaded to the managed GPUBuffer when commit() is called
   */
  public readonly managedData: ArrayBuffer | null = null

  /**
   * Indicates whether the buffer is currently managed by this class or has been
   * replaced by an externally provided GPUBuffer.
   */
  public readonly isManaged: boolean

  public readonly bindingResource: GPUBindingResource
  public readonly layoutEntry: GPUBindGroupLayoutEntry
  public readonly isTexture: boolean
  public readonly isSampler: boolean
  public readonly block: string
  public readonly nameInShader: string
  public readonly info: WgslResourceInfo

  public get isDirty(): boolean {
    return this.dirtyMin < this.dirtyMax
  }

  public get isBuffer(): boolean {
    return !!this.managedBuffer
  }

  private dirtyMin: number = Infinity
  private dirtyMax: number = -Infinity
  private managedBuffer: GPUBuffer | null = null
  private changeHandler: WebGpuShaderResourceHandler[] = []

  public constructor(device: WebGpuDevice, info: WgslResourceInfo, isCompute: boolean) {
    this.device = device
    this.info = info
    this.block = info.annotations[ShaderAnnotations.Block] || info.name
    this.nameInShader = info.name

    this.layoutEntry = getLayoutEntry(info, isCompute ? COMPUTE_VISIBILITY : RENDER_VISIBILITY)
    if (info.texture) {
      this.isTexture = true
      this.bindingResource = this.device.defaultTexture.gpuObject
    } else if (info.sampler) {
      this.isSampler = true
      this.bindingResource = this.device.getSampler(SamplerState.Default).resource
    } else {
      const alignTo = info.isStorage ? 256 : 4
      const size = Math.ceil(info.size / alignTo) * alignTo

      this.isManaged = true
      this.managedData = new ArrayBuffer(size)
      this.managedBuffer = this.device.gpu.createBuffer({
        label: getBufferLabel(info),
        usage: getBufferUsage(info),
        size: this.managedData.byteLength,
      })
      this.setResource(this.managedBuffer)
    }
  }

  public markAsChanged(byteOffset: number = 0, byteLength: number = this.managedData?.byteLength ?? 0): void {
    this.dirtyMin = Math.min(this.dirtyMin, byteOffset)
    this.dirtyMax = Math.max(this.dirtyMax, byteOffset + byteLength)
  }

  public setTexture(resource: GPUTexture | GPUTextureView | GPUExternalTexture) {
    if (!this.isTexture) {
      throw new Error(`Cannot set texture on non-texture parameter '${this.nameInShader}'`)
    }
    this.setResource(resource)
  }

  public setSampler(resource: GPUSampler) {
    if (!this.isSampler) {
      throw new Error(`Cannot set sampler on non-sampler parameter '${this.nameInShader}'`)
    }
    this.setResource(resource)
  }

  public setBuffer(resource: GPUBuffer | GPUBufferBinding) {
    if (!this.managedBuffer) {
      throw new Error(`Cannot set buffer on non-buffer parameter '${this.nameInShader}'`)
    }
    const self = this as Mutable<this>
    resource ||= this.managedBuffer
    self.isManaged = this.managedBuffer === resource
    this.setResource(resource)
  }

  private setResource(resource: GPUBindingResource) {
    const didChange = this.bindingResource !== resource
    const self = this as Mutable<this>
    self.bindingResource = resource
    if (didChange) {
      // updates the GPUBindGroupEntry in the parent WebGpuProgram when this resource is changed
      for (const handler of this.changeHandler) {
        handler(this)
      }
    }
  }

  private resetDirty(): void {
    this.dirtyMin = Infinity
    this.dirtyMax = -Infinity
  }

  public commit() {
    if (!this.isManaged || !this.isDirty) {
      return
    }
    // writeBuffer requires 4-byte alignment on offset and size
    const alignedMin = this.dirtyMin & ~3
    const alignedMax = (this.dirtyMax + 3) & ~3
    this.device.queue.writeBuffer(
      this.managedBuffer,
      alignedMin,
      this.managedData!,
      alignedMin,
      alignedMax - alignedMin,
    )
    this.resetDirty()
  }

  public dispose() {
    this.managedBuffer?.destroy()
    this.changeHandler.length = 0
  }

  public onResourceChanged(handler: WebGpuShaderResourceHandler) {
    this.changeHandler.push(handler)
  }

  public offResourceChanged(handler: WebGpuShaderResourceHandler) {
    const index = this.changeHandler.indexOf(handler)
    if (index >= 0) {
      this.changeHandler.splice(index, 1)
    }
  }
}

function getLayoutEntry(info: WgslResourceInfo, visibility: number): GPUBindGroupLayoutEntry {
  const result: GPUBindGroupLayoutEntry = {
    visibility,
    binding: info.binding,
  }

  if (info.texture && info.texture.external) {
    result.externalTexture = {}
    return result
  }

  if (info.texture && info.texture.storage) {
    result.storageTexture = {
      format: 'rgba8unorm', // TODO
      access: 'read-only', // TODO
      viewDimension: getViewDimension(info.texture),
    }
    return result
  }

  if (info.texture) {
    result.texture = {
      multisampled: info.texture.multisample,
      viewDimension: getViewDimension(info.texture),
      sampleType: getSampleType(info),
    }
    return result
  }

  if (info.sampler) {
    result.sampler = {
      type: info.sampler.comparison ? 'comparison' : 'filtering',
    }
    return result
  }

  result.buffer = {
    type: info.isUniform ? 'uniform' : info.isReadWrite ? 'storage' : 'read-only-storage',
  }

  return result
}

function getViewDimension(texture: WgslTextureInfo): GPUTextureViewDimension {
  if (texture.cube) {
    return texture.array ? 'cube-array' : 'cube'
  }
  if (texture.dimension) {
    return texture.array ? `2d-array` : `${texture.dimension as 1 | 2 | 3}d`
  }
  return '2d'
}

function getSampleType(info: WgslResourceInfo): GPUTextureSampleType {
  if (info.texture.depth) {
    return 'depth'
  }
  switch (info.elementType) {
    case 'float32':
    case 'float16':
      return 'float'
    // TODO: handle unfilterable-float for specific texture formats
    case 'uint32':
    case 'uint16':
    case 'uint8':
      return 'uint'
    case 'int32':
    case 'int16':
    case 'int8':
      return 'sint'
  }
}

function getBufferLabel(info: WgslResourceInfo) {
  let label = `ShaderResource: ${info.name}|COPY_DST`
  if (info.isStorage) {
    label += '|STORAGE'
  } else {
    label += '|UNIFORM'
  }
  return label
}

function getBufferUsage(info: WgslResourceInfo) {
  let usage = GPUBufferUsage.COPY_DST
  if (info.isStorage) {
    usage = usage | GPUBufferUsage.STORAGE
  } else {
    usage = usage | GPUBufferUsage.UNIFORM
  }
  return usage
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
