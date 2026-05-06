import { compareFunctionToWebGPU, textureWrapModeToWebGPU } from '../../enums'
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
    addressModeU: textureWrapModeToWebGPU(state.wrapU),
    addressModeV: textureWrapModeToWebGPU(state.wrapV),
    addressModeW: textureWrapModeToWebGPU(state.wrapW),
    magFilter: state.magFilter === 'Nearest' ? 'nearest' : 'linear',
    minFilter: state.minFilter === 'Nearest' ? 'nearest' : 'linear',
    lodMinClamp: state.minLod,
    lodMaxClamp: state.maxLod,
    compare: state.compare ? compareFunctionToWebGPU(state.compareFunc) : undefined,
  }
  switch (state.mipFilter) {
    case 'Linear':
      descriptor.mipmapFilter = 'linear'
      break
    case 'Nearest':
      descriptor.mipmapFilter = 'nearest'
      break
  }
  return descriptor
}
