import type { BlendState } from '../../states'
import { structureCache } from './StructureCache'

export interface ColorTargetParams {
  format: GPUTextureFormat
  writeMask: number
  blendState: BlendState
}

export type ColorTargetCache = ReturnType<typeof colorTargetCache>
export function colorTargetCache() {
  return structureCache<ColorTargetParams, GPUColorTargetState>({
    shape: {
      blendState: 'weak',
      format: 'map',
      writeMask: 'map',
    },
    create: (params: ColorTargetParams) => {
      return {
        format: params.format,
        writeMask: params.writeMask,
        blend: getBlendState(params.blendState),
      }
    },
  })
}

function getBlendState(state: BlendState): GPUBlendState {
  return {
    color: {
      srcFactor: state.colorSrcBlend,
      dstFactor: state.colorDstBlend,
      operation: state.colorBlendFunction,
    },
    alpha: {
      srcFactor: state.alphaSrcBlend,
      dstFactor: state.alphaDstBlend,
      operation: state.alphaBlendFunction,
    },
  }
}

export function colorTargetListCache() {
  const cache: Record<number, Array<GPUColorTargetState[]>> = {}
  return {
    clear() {
      for (const key in cache) {
        delete cache[key]
      }
    },
    get(list: GPUColorTargetState[], length: number): GPUColorTargetState[] {
      if (list.length < length) {
        throw new Error('List length does not match the specified length.')
      }
      cache[length] ||= []
      const candidates = cache[length]
      for (const candidate of candidates) {
        let match = true
        for (let i = 0; i < length; i++) {
          if (candidate[i] !== list[i]) {
            match = false
            break
          }
        }
        if (match) {
          return candidate
        }
      }

      const newCandidate = list.slice(0, length)
      candidates.push(newCandidate)
      return newCandidate
    },
  }
}
