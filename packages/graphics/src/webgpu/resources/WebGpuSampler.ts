import type { SamplerState } from '../../states'
import type { WebGpuDevice } from '../WebGpuDevice'

export class WebGpuSampler {
  public readonly state: SamplerState
  public readonly resource: GPUSampler

  public constructor(device: WebGpuDevice, state: SamplerState) {
    this.state = state
    this.resource = device.gpu.createSampler(getDescriptor(this.state))
  }
}

function getDescriptor(state: SamplerState): GPUSamplerDescriptor {
  const descriptor: GPUSamplerDescriptor = {
    addressModeU: state.wrapU,
    addressModeV: state.wrapV,
    addressModeW: state.wrapW,
    magFilter: state.magFilter,
    minFilter: state.minFilter,
    lodMinClamp: state.minLod,
    lodMaxClamp: state.maxLod,
    compare: state.compare ? state.compareFunc : undefined,
  }
  switch (state.mipFilter) {
    case 'linear':
      descriptor.mipmapFilter = 'linear'
      if (descriptor.magFilter === 'linear' && descriptor.minFilter === 'linear') {
        descriptor.maxAnisotropy = 8 // TODO: make it configurable
      }
      break
    case 'nearest':
      descriptor.mipmapFilter = 'nearest'
      break
  }
  return descriptor
}
