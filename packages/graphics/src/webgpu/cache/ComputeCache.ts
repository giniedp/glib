import { ShaderConstants } from '../../states'
import { WebGpuShaderModule } from '../resources'
import type { WebGpuDevice } from '../WebGpuDevice'
import { structureCache, type StructureCache } from './StructureCache'

export interface ComputePipelineParams {
  async?: boolean
  shader: WebGpuShaderModule
  constants: ShaderConstants
}

export type ComputePipelineCache = StructureCache<ComputePipelineParams, GPUComputePipeline>

export function computePipelineCache(device: WebGpuDevice): ComputePipelineCache {
  return structureCache<ComputePipelineParams, GPUComputePipeline>({
    shape: {
      shader: 'weak',
      constants: 'map',
    },
    create: (params: ComputePipelineParams) => {
      const program = params.shader
      const descriptor: GPUComputePipelineDescriptor = {
        // label: program.name // TODO:
        layout: program.pipelineLayout,
        compute: {
          module: program.gpuObject,
          entryPoint: program.computeFn,
          // constants: see below
        },
      }
      if (params.constants) {
        descriptor.compute.constants = params.constants.state
      }
      if (params.async) {
        return device.gpu.createComputePipelineAsync(descriptor)
      }
      return device.gpu.createComputePipeline(descriptor)
    },
  })
}
