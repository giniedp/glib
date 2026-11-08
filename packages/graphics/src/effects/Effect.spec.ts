import { beforeEach, describe, expect, it } from 'vitest'
import { Device } from '../Device'
import { BlendState } from '../states'
import { WebglDevice } from '../webgl'
import { WebGpuDevice } from '../webgpu'
import { BasicMaterial } from './BasicMaterial'
import { Effect } from './Effect'

describe('Effect', () => {
  describe('WebGPU', () => {
    runContract(() => new WebGpuDevice({}))
  })

  describe('WebGL', () => {
    runContract(() => new WebglDevice({}))
  })
})

const RGB = 0x7

function runContract(createDevice: () => WebGpuDevice | WebglDevice) {
  let device: Device
  let base: Effect
  beforeEach(async () => {
    device = await createDevice().ready
    base = new BasicMaterial(device, { properties: {} }).effect
    await base.program.compiled
  })

  describe('renderBlends', () => {
    it('applies a blend state to each target and restores the previous ones', () => {
      const effect = new Effect(device, {
        ...base.cloneOptions(),
        renderBlends: [BlendState.Alpha, BlendState.Alpha, BlendState.Alpha],
        renderMasks: [RGB, RGB, RGB],
      })
      const pass = device.renderPass
      pass.setRenderBlend(0, BlendState.Opaque)
      pass.setRenderBlend(1, BlendState.Opaque)
      pass.setRenderBlend(2, BlendState.Additive)

      effect.applyState(pass)
      expect(pass.getRenderBlend(0)).toBe(BlendState.Alpha)
      expect(pass.getRenderBlend(1)).toBe(BlendState.Alpha)
      expect(pass.getRenderBlend(2)).toBe(BlendState.Alpha)

      effect.restoreState(pass)
      expect(pass.getRenderBlend(0)).toBe(BlendState.Opaque)
      expect(pass.getRenderBlend(1)).toBe(BlendState.Opaque)
      expect(pass.getRenderBlend(2)).toBe(BlendState.Additive)
    })

    it('leaves targets without an entry unchanged', () => {
      const effect = new Effect(device, { ...base.cloneOptions(), renderBlends: [null, BlendState.Alpha] })
      const pass = device.renderPass
      pass.setRenderBlend(0, BlendState.Additive)
      pass.setRenderBlend(1, BlendState.Opaque)

      effect.applyState(pass)
      expect(pass.getRenderBlend(0)).toBe(BlendState.Additive)
      expect(pass.getRenderBlend(1)).toBe(BlendState.Alpha)
      effect.restoreState(pass)
      expect(pass.getRenderBlend(1)).toBe(BlendState.Opaque)
    })

    it('takes precedence over blendState for target 0 and restores the state from before both', () => {
      const effect = new Effect(device, {
        ...base.cloneOptions(),
        blendState: BlendState.Additive,
        renderBlends: [BlendState.Alpha],
      })
      const pass = device.renderPass
      pass.setRenderBlend(0, BlendState.Opaque)

      effect.applyState(pass)
      expect(pass.getRenderBlend(0)).toBe(BlendState.Alpha)
      effect.restoreState(pass)
      expect(pass.getRenderBlend(0)).toBe(BlendState.Opaque)
    })

    it('is kept by clones, like renderMasks', () => {
      const effect = new Effect(device, {
        ...base.cloneOptions(),
        renderBlends: [BlendState.Alpha, BlendState.Alpha],
        renderMasks: [RGB, RGB],
      })
      const clone = effect.clone()
      expect(clone.renderBlends).toEqual([BlendState.Alpha, BlendState.Alpha])
      expect(clone.renderMasks).toEqual([RGB, RGB])
    })
  })
}
