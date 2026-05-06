import { Device, WebglDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { materialProgram } from './assembleProgram'

describe('@gglib/materials/assembleProgram', () => {
  let device: Device

  beforeEach(() => {
    device = new WebglDevice({})
  })

  it('default is valid', async () => {
    const program = device.createShaderModule(materialProgram({}))
    const linked = await program.ready
    expect(program.isReady).toBe(true)
    expect(linked).toBe(true)
  })

  it('ALPHA_CLIP is valid', async () => {
    const program = device.createShaderModule(
      materialProgram({
        ALPHA_CLIP: true,
      }),
    )
    const linked = await program.ready
    expect(program.isReady).toBe(true)
    expect(linked).toBe(true)
  })

  it('pbr is valid', async () => {
    const program = device.createShaderModule(
      materialProgram({
        // ALPHA_CLIP: false,
        // BASE_COLOR: false,
        BASE_COLOR_MAP: true,
        // EMISSIVE_COLOR: false,
        // EMISSIVE_COLOR_MAP: false,
        LIGHT: true,
        // METALLIC_ROUGHNESS: false,
        METALLIC_ROUGHNESS_MAP: true,
        // NORMAL_MAP: false,
        OCCLUSION_MAP: true,
        SHADE_FUNCTION: 'shadePbr',
        // SPECULAR_COLOR: false,
        // SPECULAR_COLOR_MAP: false,
      }),
    )
    const linked = await program.ready
    expect(program.isReady).toBe(true)
    expect(linked).toBe(true)
  })
})
