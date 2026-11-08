import { describe, expect, it } from 'vitest'
import { textureTypeToWebGL, textureTypeToWebGPUDimension } from './TextureType'

describe('TextureType', () => {
  it('maps a cube array to a 2d texture in WebGPU', () => {
    expect(textureTypeToWebGPUDimension('cube-array')).toBe('2d')
  })

  it('has no WebGL counterpart for a cube array', () => {
    expect(textureTypeToWebGL('cube-array')).toBe(0)
  })
})
