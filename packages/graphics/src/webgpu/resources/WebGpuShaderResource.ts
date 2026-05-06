import { SamplerState } from '../../states'
import type { WebGpuDevice } from '../WebGpuDevice'
import type { WgslResourceInfo, WgslTextureInfo } from '../wgsl'

const COMMON_VISIBILITY = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE
export class WebGpuShaderResource {
  public readonly device: WebGpuDevice
  public readonly arrayBuffer: ArrayBuffer

  public hasChanged: boolean
  public readonly buffer: GPUBuffer = null
  public readonly resource: GPUBindingResource
  public readonly layoutEntry: GPUBindGroupLayoutEntry
  public readonly resourceEntry: GPUBindGroupEntry
  public readonly info: WgslResourceInfo

  private changeHandler: Function[] = []

  public constructor(device: WebGpuDevice, info: WgslResourceInfo) {
    this.device = device
    this.info = info

    this.layoutEntry = getLayoutEntry(info)
    if (!info.texture && !info.sampler) {
      this.arrayBuffer = new ArrayBuffer(info.size)
      this.buffer = this.device.gpu.createBuffer({
        label: `ShaderResource: ${info.name}`,
        size: this.arrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      this.resource = {
        buffer: this.buffer,
        offset: 0,
        size: this.arrayBuffer.byteLength,
      }
    } else if (info.texture) {
      this.resource = this.device.defaultTexture.gpuObject
    } else if (info.sampler) {
      this.resource = this.device.getSampler(SamplerState.Default).resource
    }

    this.resourceEntry = {
      binding: info.binding,
      resource: this.resource,
    }
    this.hasChanged = false
  }

  public markAsChanged() {
    this.hasChanged = true
  }

  public setResource(resource: GPUBindingResource) {
    const didChange = this.resource !== resource
    this.assign('resource', resource)
    if (didChange) {
      for (const handler of this.changeHandler) {
        handler(this)
      }
    }
  }

  public commit() {
    this.resourceEntry.resource = this.resource
    if (this.buffer) {
      this.device.queue.writeBuffer(this.buffer, 0, this.arrayBuffer)
    }
  }

  public dispose() {
    this.buffer?.destroy()
    this.changeHandler.length = 0
  }

  public onResourceChanged(handler: Function) {
    this.changeHandler.push(handler)
  }

  public offResourceChanged(handler: Function) {
    const index = this.changeHandler.indexOf(handler)
    if (index >= 0) {
      this.changeHandler.splice(index, 1)
    }
  }

  protected assign<K extends keyof this>(key: K, value: this[K]) {
    this[key] = value
  }
}

function getLayoutEntry(info: WgslResourceInfo): GPUBindGroupLayoutEntry {
  const result: GPUBindGroupLayoutEntry = {
    visibility: COMMON_VISIBILITY,
    binding: info.binding,
  }
  if (info.texture && info.texture.external) {
    result.externalTexture = {}
  } else if (info.texture && info.texture.storage) {
    result.storageTexture = {
      format: 'rgba8unorm', // TODO
      access: 'read-only', // TODO
      viewDimension: getViewDimension(info.texture),
    }
  } else if (info.texture) {
    result.texture = {
      multisampled: info.texture.multisample,
      viewDimension: getViewDimension(info.texture),
      sampleType: getSampleType(info),
    }
  } else if (info.sampler) {
    result.sampler = {
      type: info.sampler.comparison ? 'comparison' : 'filtering',
    }
  } else {
    result.buffer = {
      type: info.isUniform ? 'uniform' : info.isReadWrite ? 'storage' : 'read-only-storage',
    }
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
