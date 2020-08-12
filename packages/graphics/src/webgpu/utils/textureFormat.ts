import { getOption } from '@gglib/utils'
import { DataType, PixelFormat } from '../../enums'

// https://gpuweb.github.io/gpuweb/#enumdef-gputextureformat

const formatLookup: { [k: number]: string } = {
  [PixelFormat.ALPHA]: 'r',
  [PixelFormat.LUMINANCE_ALPHA]: 'rg',
  [PixelFormat.RGB]: 'rgba',
  [PixelFormat.RGBA]: 'rgba',
}
const typeLookup: { [k: string]: string } = {
  [DataType.int8]: '8sint',
  [DataType.uint8]: '8uint',
  [DataType.int16]: '16sint',
  [DataType.uint16]: '16uint',
  [DataType.int32]: '32sint',
  [DataType.uint32]: '32uint',
  [DataType.float32]: '32float',
}

export function toTextureFormat(f: PixelFormat, t: DataType, normalized: boolean = true, srgb: boolean = false): GPUTextureFormat {
  let result = getOption(formatLookup, f, 'rgba')
  result += getOption(typeLookup, t, '8sint')
  if (normalized) {
    result = result.replace(/int/, 'norm')
  }
  if (srgb) {
    result = `${result}-srgb`
  }
  return result as GPUTextureFormat
}
