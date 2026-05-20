import { beforeEach, describe, expect, it } from 'vitest'
import { Device } from '../Device'
import { WebglDevice } from '../webgl'
import { WebGpuDevice } from '../webgpu'
import { BasicMaterial } from './BasicMaterial'
import { CommonInputs } from './types'

describe('BasicMaterial', () => {
  describe('WebGPU', () => {
    runContract(() => {
      return new WebGpuDevice({})
    })
  })

  describe('WebGL', () => {
    runContract(() => {
      return new WebglDevice({})
    })
  })
})

function runContract(createDevice: () => WebGpuDevice | WebglDevice) {
  let device: Device
  let material: BasicMaterial
  beforeEach(async () => {
    device = await createDevice().ready
    material = new BasicMaterial(device)
    await material.effect.program.module.ready
  })

  describe('get/set', () => {
    it('World', () => {
      const zero = new Float32Array(16)
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      material.World = data
      expect(material.World).toEqual(data)
      expect(material.effect.program.get(CommonInputs.Object.ModelMatrix.key).rawValue).toEqual(zero)
      expect(material.effect.applyInputs(material.inputBlocks)).toBe(true)
      expect(material.effect.program.get(CommonInputs.Object.ModelMatrix.key).rawValue).toEqual(new Float32Array(data))
    })

    it('View', () => {
      const zero = new Float32Array(16)
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      material.View = data
      expect(material.View).toEqual(data)
      expect(material.effect.program.get(CommonInputs.View.ViewMatrix.key).rawValue).toEqual(zero)
      expect(material.effect.applyInputs(material.inputBlocks)).toBe(true)
      expect(material.effect.program.get(CommonInputs.View.ViewMatrix.key).rawValue).toEqual(new Float32Array(data))
    })

    it('Projection', () => {
      const zero = new Float32Array(16)
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      material.Projection = data
      expect(material.Projection).toEqual(data)
      expect(material.effect.program.get(CommonInputs.View.ProjectionMatrix.key).rawValue).toEqual(zero)
      expect(material.effect.applyInputs(material.inputBlocks)).toBe(true)
      expect(material.effect.program.get(CommonInputs.View.ProjectionMatrix.key).rawValue).toEqual(
        new Float32Array(data),
      )
    })
  })

  describe('shared blocks', () => {
    let material2: BasicMaterial
    beforeEach(() => {
      material2 = new BasicMaterial(device)
    })

    it('shares view block', () => {
      const zero = new Float32Array(16)
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      material.View = data
      expect(material.effect.program.module).toBe(material2.effect.program.module)

      expect(material.View).toEqual(data)
      expect(material2.View).toBeUndefined() // the blocks are shared but the inputs are not

      expect(material.effect.program.get(CommonInputs.View.ViewMatrix.key).rawValue).toEqual(zero)
      expect(material2.effect.program.get(CommonInputs.View.ViewMatrix.key).rawValue).toEqual(zero)

      expect(material.effect.applyInputs(material.inputBlocks)).toBe(true)

      // both programs received the update
      expect(material.effect.program.get(CommonInputs.View.ViewMatrix.key).rawValue).toEqual(new Float32Array(data))
      expect(material2.effect.program.get(CommonInputs.View.ViewMatrix.key).rawValue).toEqual(new Float32Array(data))
    })

    it('shares global block (fog)', () => {
      const zero = new Float32Array(3)
      const data = [1, 2, 3]
      const color = { x: 1, y: 2, z: 3 }

      material.FogColor = color
      expect(material.effect.program.module).toBe(material2.effect.program.module)

      expect(material.FogColor).toEqual(color)
      expect(material2.FogColor).toBeUndefined() // the blocks are shared but the inputs are not

      expect(material.effect.program.get(CommonInputs.Global.FogColor.key).rawValue).toEqual(zero)
      expect(material2.effect.program.get(CommonInputs.Global.FogColor.key).rawValue).toEqual(zero)

      expect(material.effect.applyInputs(material.inputBlocks)).toBe(true)

      // both programs received the update
      expect(material.effect.program.get(CommonInputs.Global.FogColor.key).rawValue).toEqual(new Float32Array(data))
      expect(material2.effect.program.get(CommonInputs.Global.FogColor.key).rawValue).toEqual(new Float32Array(data))
    })

    it('doesnt share material block', () => {
      const zero = new Float32Array(3)
      const data = [1, 2, 3]
      const color = { x: 1, y: 2, z: 3 }

      material.BaseColor = color
      expect(material.effect.program.module).toBe(material2.effect.program.module)

      expect(material.BaseColor).toEqual(color)
      expect(material2.BaseColor).toBeUndefined() // the blocks are shared but the inputs are not

      expect(material.effect.program.get('material.baseColor').rawValue).toEqual(zero)
      expect(material2.effect.program.get('material.baseColor').rawValue).toEqual(zero)

      expect(material.effect.applyInputs(material.inputBlocks)).toBe(true)

      expect(material.effect.program.get('material.baseColor').rawValue).toEqual(new Float32Array(data))
      expect(material2.effect.program.get('material.baseColor').rawValue).toEqual(zero)
    })
  })
}
