import { beforeEach, describe, expect, it } from 'vitest'
import type { Device } from './Device'
import { BasicMaterial } from './effects'
import { Geometry, Mesh, type GeometryOptions } from './geometry'
import { vertexLayout } from './resources'
import { WebglDevice } from './webgl'
import { WebGpuDevice } from './webgpu'

describe('Ownership', () => {
  describe('WebGPU', () => {
    runContract(() => new WebGpuDevice({ surfaceFormat: 'rgba8unorm' }))
  })
  describe('WebGL', () => {
    runContract(() => new WebglDevice({}))
  })
})

function runContract(createDevice: () => Device) {
  let device: Device

  beforeEach(async () => {
    device = await createDevice().ready
  })

  function geometryOptions(): GeometryOptions {
    return {
      vertexBuffer: [
        {
          layout: vertexLayout(['position']),
          data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        },
      ],
      indexBuffer: {
        data: new Uint16Array([0, 1, 2, 0]),
      },
    }
  }

  describe('Buffer', () => {
    it('is owned by the global scope', () => {
      const count = device.stats().bufferCount
      const buffer = device.createIndexBuffer({ data: new Uint16Array([0, 1, 2, 0]) })
      expect(buffer.owners.defaultOwner).toBe(device.scope)
      expect(device.stats().bufferCount).toBe(count + 1)
      buffer.dispose()
      expect(buffer.owners.isFinalized).toBe(true)
      expect(device.stats().bufferCount).toBe(count)
    })

    it('is owned by the given scope', () => {
      const scope = device.createScope('test')
      const buffer = device.createIndexBuffer({ data: new Uint16Array([0, 1, 2, 0]), scope })
      expect(scope.has(buffer)).toBe(true)
      expect(device.scope.has(buffer)).toBe(false)
      scope.dispose()
      expect(buffer.owners.isFinalized).toBe(true)
    })

    it('keeps the owners when recreated with a different size', () => {
      const buffer = device.createIndexBuffer({ data: new Uint16Array([0, 1, 2, 0]) })
      buffer.setData(new Uint16Array([0, 1, 2, 3, 4, 5]))
      expect(buffer.owners.isFinalized).toBe(false)
      expect(buffer.elementCount).toBe(6)
    })
  })

  describe('Geometry', () => {
    it('disposes created buffers', () => {
      const geometry = new Geometry(device, geometryOptions())
      const { vertexBuffer, indexBuffer } = geometry
      geometry.dispose()
      expect(vertexBuffer.owners.isFinalized).toBe(true)
      expect(indexBuffer.owners.isFinalized).toBe(true)
    })

    it('does not dispose borrowed buffers', () => {
      const source = new Geometry(device, geometryOptions())
      const geometry = new Geometry(device, {
        vertexBuffer: source.vertexBuffer,
        indexBuffer: source.indexBuffer,
      })
      geometry.dispose()
      expect(source.vertexBuffer.owners.isFinalized).toBe(false)
      expect(source.indexBuffer.owners.isFinalized).toBe(false)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const geometry = scope.own(new Geometry(device, geometryOptions()))
      const { vertexBuffer, indexBuffer } = geometry
      expect(scope.has(vertexBuffer)).toBe(true)
      expect(device.scope.has(vertexBuffer)).toBe(false)
      scope.dispose()
      expect(geometry.owners.isFinalized).toBe(true)
      expect(vertexBuffer.owners.isFinalized).toBe(true)
      expect(indexBuffer.owners.isFinalized).toBe(true)
    })
  })

  describe('Material', () => {
    it('borrows texture instances', () => {
      const texture = device.createTexture({ width: 1, height: 1 })
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', texture)
      material.dispose()
      expect(texture.owners.isFinalized).toBe(false)
    })

    it('disposes created textures', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', { width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      expect(texture.owners.isFinalized).toBe(false)
      material.dispose()
      expect(texture.owners.isFinalized).toBe(true)
    })

    it('disposes a created texture when replaced', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', { width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      material.set('texture', 'baseMap', device.defaultTexture)
      expect(texture.owners.isFinalized).toBe(true)
    })

    it('does not dispose acquired textures', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', { key: 'shared', width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      material.dispose()
      expect(texture.owners.isFinalized).toBe(false)
    })

    it('passes its owners to textures created later', () => {
      const scope = device.createScope('test')
      const material = scope.own(new BasicMaterial(device, { properties: {} }))
      material.set('texture', 'baseMap', { key: 'late', width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      expect(scope.has(texture)).toBe(true)
      expect(device.scope.has(texture)).toBe(false)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const material = scope.own(new BasicMaterial(device, { properties: {} }))
      material.set('texture', 'baseMap', { width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      const effect = material.effect
      scope.dispose()
      expect(material.owners.isFinalized).toBe(true)
      expect(effect.owners.isFinalized).toBe(true)
      expect(texture.owners.isFinalized).toBe(true)
    })
  })

  describe('Mesh', () => {
    function createMesh() {
      return new Mesh(device, {
        materials: [{ properties: {} }],
        geometries: [geometryOptions()],
        parts: [{ geometryIndex: 0, materialIndex: 0 }],
      })
    }

    it('disposes created geometries and materials', () => {
      const mesh = createMesh()
      const [geometry] = mesh.geometries
      const [material] = mesh.materials
      mesh.dispose()
      expect(geometry.owners.isFinalized).toBe(true)
      expect(material.owners.isFinalized).toBe(true)
    })

    it('keeps the original when an instance is disposed', () => {
      const mesh = createMesh()
      const instance = mesh.instantiate({ materials: true })
      const [geometry] = mesh.geometries
      const [material] = mesh.materials
      const [instanceMaterial] = instance.materials
      instance.dispose()
      expect(geometry.owners.isFinalized).toBe(false)
      expect(geometry.vertexBuffer.owners.isFinalized).toBe(false)
      expect(material.owners.isFinalized).toBe(false)
      expect(instanceMaterial.owners.isFinalized).toBe(true)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const mesh = scope.own(createMesh())
      const [geometry] = mesh.geometries
      const [material] = mesh.materials
      const vertexBuffer = geometry.vertexBuffer
      scope.dispose()
      expect(mesh.owners.isFinalized).toBe(true)
      expect(geometry.owners.isFinalized).toBe(true)
      expect(material.owners.isFinalized).toBe(true)
      expect(vertexBuffer.owners.isFinalized).toBe(true)
    })

    it('shares an instance between scopes', () => {
      const a = device.createScope('a')
      const b = device.createScope('b')
      const mesh = a.own(createMesh())
      b.own(mesh)
      const [geometry] = mesh.geometries
      a.dispose()
      expect(mesh.owners.isFinalized).toBe(false)
      expect(geometry.owners.isFinalized).toBe(false)
      b.dispose()
      expect(mesh.owners.isFinalized).toBe(true)
      expect(geometry.owners.isFinalized).toBe(true)
    })
  })
}
