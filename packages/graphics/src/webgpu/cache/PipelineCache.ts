import { type PrimitiveType, type SurfaceFormat } from '../../enums'
import type { CullState, DepthBiasState, DepthState, StencilState } from '../../states'
import { ShaderConstants } from '../../states'
import { WebGpuShaderModule } from '../resources'
import type { WebGpuDevice } from '../WebGpuDevice'
import { structureCache, type StructureCache } from './StructureCache'

export interface RenderPipelineParams {
  async?: boolean
  shader: WebGpuShaderModule
  vertexConstants: ShaderConstants
  fragmentConstants: ShaderConstants
  vertexLayout: Array<GPUVertexBufferLayout | null | undefined>
  targets: GPUColorTargetState[]
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

export type RenderPipelineCache = StructureCache<RenderPipelineParams, GPURenderPipeline>

type PipelineEntry = GPURenderPipeline | Promise<GPURenderPipeline>

/**
 * Upper bounds of the ids packed into the numeric keys of {@link renderPipelineCache}
 */
const OBJECT_ID_LIMIT = 1 << 21
const STATE_ID_LIMIT = 1 << 16

/**
 * Render pipelines by their parameters.
 *
 * @remarks
 * Looks pipelines up by the shader module and three numbers that pack the ids of all other parameters: the state
 * objects have numeric ids, vertex layouts and color target lists are interned by their caches. That's four map
 * lookups instead of one per parameter, and the last pipeline is remembered for repeated lookups of the same
 * parameters. Parameters that don't fit the keys (a multisample mask, constants that are not the module's, ids above
 * the limits) take the generic structure cache.
 */
export function renderPipelineCache(device: WebGpuDevice): RenderPipelineCache {
  const generic = genericRenderPipelineCache(device)
  const byModule = new WeakMap<WebGpuShaderModule, Map<number, Map<number, Map<number, PipelineEntry>>>>()
  const objectIds = new WeakMap<object, number>()
  const stringIds = new Map<string, number>()
  let nextObjectId = 1

  const objectId = (value: object | null | undefined) => {
    if (!value) {
      return 0
    }
    let id = objectIds.get(value)
    if (id === undefined) {
      id = nextObjectId++
      objectIds.set(value, id)
    }
    return id
  }
  const stringId = (value: string | null | undefined) => {
    if (value == null) {
      return 0
    }
    let id = stringIds.get(value)
    if (id === undefined) {
      id = stringIds.size + 1
      stringIds.set(value, id)
    }
    return id
  }

  let lastModule: WebGpuShaderModule = null
  let lastKey1 = -1
  let lastKey2 = -1
  let lastKey3 = -1
  let lastPipeline: GPURenderPipeline = null

  function lookup(params: RenderPipelineParams): PipelineEntry | null {
    const module = params.shader
    const layoutId = objectId(params.vertexLayout)
    const targetsId = objectId(params.targets)
    const cullId = params.cullState?.id ?? 0
    const biasId = params.depthBiasState?.id ?? 0
    const stencilId = params.stencilState?.id ?? 0
    const depthId = params.depthState?.id ?? 0
    const formatId = stringId(params.depthFormat)
    const primitiveId = stringId(params.primitiveType)
    const samples = params.multisampleCount ?? 0
    if (
      !module ||
      params.multisampleMask != null ||
      params.vertexConstants !== module.vertexConstants ||
      params.fragmentConstants !== module.fragmentConstants ||
      layoutId >= OBJECT_ID_LIMIT ||
      targetsId >= OBJECT_ID_LIMIT ||
      cullId >= STATE_ID_LIMIT ||
      biasId >= STATE_ID_LIMIT ||
      stencilId >= STATE_ID_LIMIT ||
      depthId >= STATE_ID_LIMIT ||
      formatId >= 64 ||
      primitiveId >= 8 ||
      samples >= 64
    ) {
      return null
    }
    // all below 2^53
    const key1 = layoutId * OBJECT_ID_LIMIT + targetsId
    const key2 = (cullId * STATE_ID_LIMIT + biasId) * STATE_ID_LIMIT + stencilId
    const key3 =
      (((depthId * 64 + formatId) * 8 + primitiveId) * 64 + samples) * 2 + (params.multisampleAlphaCoverage ? 1 : 0)

    if (module === lastModule && key1 === lastKey1 && key2 === lastKey2 && key3 === lastKey3 && lastPipeline) {
      return lastPipeline
    }

    let byKey1 = byModule.get(module)
    if (!byKey1) {
      byKey1 = new Map()
      byModule.set(module, byKey1)
    }
    let byKey2 = byKey1.get(key1)
    if (!byKey2) {
      byKey2 = new Map()
      byKey1.set(key1, byKey2)
    }
    let byKey3 = byKey2.get(key2)
    if (!byKey3) {
      byKey3 = new Map()
      byKey2.set(key2, byKey3)
    }
    let entry = byKey3.get(key3)
    if (entry === undefined) {
      entry = createRenderPipeline(device, params)
      byKey3.set(key3, entry)
      if (isPromiseLike(entry)) {
        const store = byKey3
        entry.then((pipeline) => store.set(key3, pipeline))
      }
    }
    if (!isPromiseLike(entry)) {
      lastModule = module
      lastKey1 = key1
      lastKey2 = key2
      lastKey3 = key3
      lastPipeline = entry
    }
    return entry
  }

  return {
    get: (params: RenderPipelineParams): GPURenderPipeline | null => {
      const entry = lookup(params)
      if (entry === null) {
        return generic.get(params)
      }
      return isPromiseLike(entry) ? null : entry
    },
    ready: async (params: RenderPipelineParams): Promise<GPURenderPipeline> => {
      return lookup(params) ?? generic.ready(params)
    },
  }
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return !!value && typeof (value as Promise<T>).then === 'function'
}

function genericRenderPipelineCache(device: WebGpuDevice): RenderPipelineCache {
  return structureCache<RenderPipelineParams, GPURenderPipeline>({
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
    create: (params: RenderPipelineParams) => createRenderPipeline(device, params),
  })
}

function createRenderPipeline(device: WebGpuDevice, params: RenderPipelineParams): PipelineEntry {
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
}

function getPrimitiveState(type: PrimitiveType, state: CullState): GPUPrimitiveState {
  const result: GPUPrimitiveState = {
    topology: type,
  }
  if (state.enable) {
    result.cullMode = state.cullMode
    result.frontFace = state.frontFace
  } else {
    result.cullMode = 'none'
    result.frontFace = state.frontFace
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
    format: format,
  }
  if (state.enabled) {
    result.depthWriteEnabled = !!state.depthWriteEnabled
    result.depthCompare = state.depthFunction
  } else {
    // a format with a depth aspect requires both: disabled = every fragment passes, nothing is written
    result.depthWriteEnabled = false
    result.depthCompare = 'always'
  }
  if (stencil.enable) {
    result.stencilFront = {
      compare: stencil.frontFunction,
      depthFailOp: stencil.frontDepthFail,
      passOp: stencil.frontDepthPass,
      failOp: stencil.frontFail,
    }
    result.stencilBack = {
      compare: stencil.backFunction,
      depthFailOp: stencil.backDepthFail,
      passOp: stencil.backDepthPass,
      failOp: stencil.backFail,
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
