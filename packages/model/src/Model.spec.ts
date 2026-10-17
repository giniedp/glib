import { BasicMaterial, Device, Mesh, vertexLayout, WebglDevice, type MeshOptions } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { Model } from './Model'

describe('@gglib/model/Model', () => {
  let device: Device

  beforeEach(() => {
    device = new WebglDevice({})
  })

  function meshOptions(): MeshOptions {
    return {
      materials: [{ properties: {} }],
      geometries: [
        {
          vertexBuffer: [
            {
              layout: vertexLayout(['position']),
              data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
            },
          ],
        },
      ],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    }
  }

  describe('ownership', () => {
    it('disposes created meshes', () => {
      const model = new Model(device, { meshes: [meshOptions()] })
      const mesh = model.meshes[0]
      model.dispose()
      expect(mesh.ownership.isFinalized).toBe(true)
    })

    it('owns passed in meshes', () => {
      const mesh = new Mesh(device, meshOptions())
      const model = new Model(device, { meshes: [mesh] })
      expect(device.scope.has(mesh)).toBe(false)
      expect(device.scope.has(model)).toBe(true)
      model.dispose()
      expect(mesh.ownership.isFinalized).toBe(true)
    })

    it('keeps the original when an instance is disposed', () => {
      const model = new Model(device, { meshes: [meshOptions()] })
      const instance = model.instantiate({ meshes: true, materials: true })
      const mesh = model.meshes[0]
      const instanceMesh = instance.meshes[0]
      instance.dispose()
      expect(instanceMesh.ownership.isFinalized).toBe(true)
      expect(mesh.ownership.isFinalized).toBe(false)
      expect(mesh.geometries[0].ownership.isFinalized).toBe(false)
    })

    it('shares meshes with instances by default', () => {
      const model = new Model(device, { meshes: [meshOptions()] })
      const instance = model.instantiate()
      expect(instance.meshes[0]).toBe(model.meshes[0])
      instance.dispose()
      expect(model.meshes[0].ownership.isFinalized).toBe(false)
    })

    it('keeps an instance intact when the scope of the original is disposed', () => {
      const a = device.createScope('a')
      const b = device.createScope('b')
      const model = a.adopt(new Model(device, { meshes: [meshOptions()] }))
      const instance = b.adopt(model.instantiate())
      const mesh = model.meshes[0]
      a.dispose()
      expect(model.ownership.isFinalized).toBe(true)
      expect(mesh.ownership.isFinalized).toBe(false)
      expect(mesh.geometries[0].vertexBuffer.ownership.isFinalized).toBe(false)
      b.dispose()
      expect(instance.ownership.isFinalized).toBe(true)
      expect(mesh.ownership.isFinalized).toBe(true)
    })

    it('owns materials created by a material factory', () => {
      const created: BasicMaterial[] = []
      const options = meshOptions()
      options.materials = [
        {
          properties: {},
          factory: (device, options) => {
            const material = new BasicMaterial(device, options)
            created.push(material)
            return material
          },
        },
      ]
      const model = new Model(device, { meshes: [options] })
      expect(created.length).toBe(1)
      expect(model.meshes[0].materials[0]).toBe(created[0])
      model.dispose()
      expect(created[0].ownership.isFinalized).toBe(true)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const model = scope.adopt(new Model(device, { meshes: [meshOptions()] }))
      const mesh = model.meshes[0]
      const material = mesh.materials[0]
      scope.dispose()
      expect(model.ownership.isFinalized).toBe(true)
      expect(mesh.ownership.isFinalized).toBe(true)
      expect(material.ownership.isFinalized).toBe(true)
    })
  })
})
