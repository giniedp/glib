import {
  compareFunctionToWebGPU,
  cullModeToWebGPU,
  frontFaceToWebGPU,
  primitiveTypeToWebGPU,
  stencilOperationToWebGPU,
  surfaceFormatToWebGPU,
  type PrimitiveType,
  type SurfaceFormat,
} from '../../enums'
import type { CullState, DepthBiasState, DepthState, StencilState } from '../../states'
import { ShaderConstants } from '../../states'
import { WebGpuShaderModule } from '../resources'
import type { WebGpuDevice } from '../WebGpuDevice'
import { structureCache, type StructureCache } from './StructureCache'

export interface PipelineParams {
  async?: boolean
  shader: WebGpuShaderModule
  vertexConstants: ShaderConstants
  fragmentConstants: ShaderConstants
  vertexLayout: ReadonlyArray<GPUVertexBufferLayout | null | undefined>
  targets: ReadonlyArray<GPUColorTargetState>
  depthFormat: SurfaceFormat
  cullState: CullState
  depthBiasState: DepthBiasState
  depthState: DepthState
  primitiveType: PrimitiveType
  stencilState: StencilState
  multisampleCount: number
  multisampleMask: number
  multisampleAlphaCoverage: boolean
}

export type PipelineCache = StructureCache<PipelineParams, GPURenderPipeline>

export function pipelineCache(device: WebGpuDevice): PipelineCache {
  return structureCache<PipelineParams, GPURenderPipeline>({
    shape: {
      shader: 'weak',
      vertexLayout: 'map',
      vertexConstants: 'map',
      fragmentConstants: 'map',
      targets: 'map',
      depthFormat: 'map',
      cullState: 'map',
      depthBiasState: 'map',
      depthState: 'map',
      primitiveType: 'map',
      stencilState: 'map',
      multisampleCount: 'map',
      multisampleMask: 'map',
      multisampleAlphaCoverage: 'map',
    },
    create: (params: PipelineParams) => {
      const program = params.shader
      const descriptor: GPURenderPipelineDescriptor = {
        // label: program.name, // TODO:
        layout: program.pipelineLayout,
        vertex: {
          module: program.gpuObject,
          entryPoint: program.vertexFn,
          // buffers: see below
          // constants: see below
        },
        fragment: {
          module: program.gpuObject,
          entryPoint: program.fragmentFn,
          targets: params.targets,
          // constants: see below
        },
        // multisample: see below
        primitive: getPrimitiveState(params.primitiveType, params.cullState),
      }
      if (params.vertexLayout) {
        descriptor.vertex.buffers = params.vertexLayout
      }
      if (params.vertexConstants) {
        descriptor.vertex.constants = params.vertexConstants.state
      }
      if (params.fragmentConstants) {
        descriptor.fragment.constants = params.fragmentConstants.state
      }
      if (params.multisampleCount > 1) {
        descriptor.multisample = {
          count: params.multisampleCount,
        }
        if (params.multisampleMask != null) {
          descriptor.multisample.mask = params.multisampleMask
        }
        if (params.multisampleAlphaCoverage) {
          descriptor.multisample.alphaToCoverageEnabled = true
        }
      }
      if (params.depthFormat) {
        descriptor.depthStencil = getDepthStencilState(
          params.depthFormat,
          params.depthState,
          params.stencilState,
          params.depthBiasState,
        )
      }

      if (params.async) {
        return device.gpu.createRenderPipelineAsync(descriptor)
      }
      return device.gpu.createRenderPipeline(descriptor)
    },
  })
}

function getPrimitiveState(type: PrimitiveType, state: CullState): GPUPrimitiveState {
  const result: GPUPrimitiveState = {
    topology: primitiveTypeToWebGPU(type),
  }
  if (state.enable) {
    result.cullMode = cullModeToWebGPU(state.cullMode)
    result.frontFace = frontFaceToWebGPU(state.frontFace)
  } else {
    result.cullMode = 'none'
    result.frontFace = frontFaceToWebGPU(state.frontFace)
  }
  // TODO:
  // stripIndexFormat:
  // unclippedDepth:
  return result
}

function getDepthStencilState(
  format: SurfaceFormat,
  state: DepthState,
  stencil: StencilState,
  bias: DepthBiasState,
): GPUDepthStencilState {
  const result: GPUDepthStencilState = {
    format: surfaceFormatToWebGPU(format),
  }
  if (state.enabled) {
    result.depthWriteEnabled = !!state.depthWriteEnabled
    result.depthCompare = compareFunctionToWebGPU(state.depthFunction)
  }
  if (stencil.enable) {
    result.stencilFront = {
      compare: compareFunctionToWebGPU(stencil.frontFunction),
      depthFailOp: stencilOperationToWebGPU(stencil.frontDepthFail),
      passOp: stencilOperationToWebGPU(stencil.frontDepthPass),
      failOp: stencilOperationToWebGPU(stencil.frontFail),
    }
    result.stencilBack = {
      compare: compareFunctionToWebGPU(stencil.backFunction),
      depthFailOp: stencilOperationToWebGPU(stencil.backDepthFail),
      passOp: stencilOperationToWebGPU(stencil.backDepthPass),
      failOp: stencilOperationToWebGPU(stencil.backFail),
    }
    result.stencilReadMask = stencil.readMask
    result.stencilWriteMask = stencil.writeMask
  }
  if (bias.enable) {
    result.depthBias = bias.bias
    result.depthBiasSlopeScale = bias.slopeScale
    result.depthBiasClamp = bias.clamp
  }
  return result
}
