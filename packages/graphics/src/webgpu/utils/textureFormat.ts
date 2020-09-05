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
  [DataType.byte]: '8sint',
  [DataType.ubyte]: '8uint',
  [DataType.short]: '16sint',
  [DataType.ushort]: '16uint',
  [DataType.int]: '32sint',
  [DataType.uint]: '32uint',
  [DataType.float]: '32float',
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
