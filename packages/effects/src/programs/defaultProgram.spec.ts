import { DeviceGL } from '@gglib/graphics'
import { defaultProgram } from './defaultProgram'

describe('@gglib/effects/fx', () => {
  let device: DeviceGL

  beforeEach(() => {
    device = new DeviceGL()
  })

  it ('default is valid', () => {
    expect(device.createProgram(defaultProgram({

    })).linked).toBe(true)
  })

  it ('ALPHA_CLIP is valid', () => {
    expect(device.createProgram(defaultProgram({
      ALPHA_CLIP: true,
    })).linked).toBe(true)
  })

  it ('pbr is valid', () => {
    expect(device.createProgram(defaultProgram({
      // ALPHA_CLIP: false,
      // DIFFUSE_COLOR: false,
      DIFFUSE_MAP: true,
      // EMISSION_COLOR: false,
      // EMISSION_MAP: false,
      LIGHT: true,
      // METALLIC_ROUGHNESS: false,
      METALLIC_ROUGHNESS_MAP: true,
      // NORMAL_MAP: false,
      OCCLUSION_MAP: true,
      SHADE_FUNCTION: 'shadePbr',
      // SPECULAR_COLOR: false,
      // SPECULAR_MAP: false,
    })).linked).toBe(true)
  })
})
