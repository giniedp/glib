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
      expect(buffer.ownership.isClaimed).toBe(false)
      expect(device.scope.has(buffer)).toBe(true)
      expect(device.stats().bufferCount).toBe(count + 1)
      buffer.dispose()
      expect(buffer.ownership.isFinalized).toBe(true)
      expect(device.stats().bufferCount).toBe(count)
    })

    it('is owned by the given scope', () => {
      const scope = device.createScope('test')
      const buffer = device.createIndexBuffer({ data: new Uint16Array([0, 1, 2, 0]), scope })
      expect(scope.has(buffer)).toBe(true)
      expect(device.scope.has(buffer)).toBe(false)
      scope.dispose()
      expect(buffer.ownership.isFinalized).toBe(true)
    })

    it('keeps the owners when recreated with a different size', () => {
      const buffer = device.createIndexBuffer({ data: new Uint16Array([0, 1, 2, 0]) })
      buffer.setData(new Uint16Array([0, 1, 2, 3, 4, 5]))
      expect(buffer.ownership.isFinalized).toBe(false)
      expect(buffer.elementCount).toBe(6)
    })
  })

  describe('Geometry', () => {
    it('disposes created buffers', () => {
      const geometry = new Geometry(device, geometryOptions())
      const { vertexBuffer, indexBuffer } = geometry
      geometry.dispose()
      expect(vertexBuffer.ownership.isFinalized).toBe(true)
      expect(indexBuffer.ownership.isFinalized).toBe(true)
    })

    it('is owned by the global scope', () => {
      const geometry = new Geometry(device, geometryOptions())
      expect(device.scope.has(geometry)).toBe(true)
      expect(device.scope.has(geometry.vertexBuffer)).toBe(false)
    })

    it('keeps buffers that are shared with another geometry', () => {
      const source = new Geometry(device, geometryOptions())
      const geometry = new Geometry(device, {
        vertexBuffer: source.vertexBuffer,
        indexBuffer: source.indexBuffer,
      })
      geometry.dispose()
      expect(source.vertexBuffer.ownership.isFinalized).toBe(false)
      expect(source.indexBuffer.ownership.isFinalized).toBe(false)
      source.dispose()
      expect(source.vertexBuffer.ownership.isFinalized).toBe(true)
      expect(source.indexBuffer.ownership.isFinalized).toBe(true)
    })

    it('takes over passed in buffers', () => {
      const indexBuffer = device.createIndexBuffer({ data: new Uint16Array([0, 1, 2, 0]) })
      const geometry = new Geometry(device, { ...geometryOptions(), indexBuffer })
      expect(device.scope.has(indexBuffer)).toBe(false)
      geometry.dispose()
      expect(indexBuffer.ownership.isFinalized).toBe(true)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const geometry = scope.adopt(new Geometry(device, geometryOptions()))
      const { vertexBuffer, indexBuffer } = geometry
      expect(Array.from(scope.walk())).toContain(vertexBuffer)
      expect(device.scope.has(geometry)).toBe(false)
      scope.dispose()
      expect(geometry.ownership.isFinalized).toBe(true)
      expect(vertexBuffer.ownership.isFinalized).toBe(true)
      expect(indexBuffer.ownership.isFinalized).toBe(true)
    })
  })

  describe('Material', () => {
    it('owns texture instances', () => {
      const texture = device.createTexture({ width: 1, height: 1 })
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', texture)
      expect(device.scope.has(texture)).toBe(false)
      material.dispose()
      expect(texture.ownership.isFinalized).toBe(true)
    })

    it('keeps a texture that is shared with another material', () => {
      const texture = device.createTexture({ width: 1, height: 1 })
      const material1 = new BasicMaterial(device, { properties: {} })
      const material2 = new BasicMaterial(device, { properties: {} })
      material1.set('texture', 'baseMap', texture)
      material2.set('texture', 'baseMap', texture)
      material1.dispose()
      expect(texture.ownership.isFinalized).toBe(false)
      material2.dispose()
      expect(texture.ownership.isFinalized).toBe(true)
    })

    it('keeps a texture that a scope owns', () => {
      const scope = device.createScope('test')
      const texture = device.createTexture({ width: 1, height: 1, scope })
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', texture)
      material.dispose()
      expect(texture.ownership.isFinalized).toBe(false)
      scope.dispose()
      expect(texture.ownership.isFinalized).toBe(true)
    })

    it('keeps a texture that is still used by another slot', () => {
      const texture = device.createTexture({ width: 1, height: 1 })
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', texture)
      material.set('texture', 'normalMap', texture)
      material.set('texture', 'baseMap', device.defaultTexture)
      expect(texture.ownership.isFinalized).toBe(false)
      material.set('texture', 'normalMap', device.defaultTexture)
      expect(texture.ownership.isFinalized).toBe(true)
    })

    it('does not take over device textures', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', device.defaultTexture)
      material.dispose()
      expect(device.defaultTexture.ownership.isFinalized).toBe(false)
    })

    it('disposes created textures', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', { width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      expect(texture.ownership.isFinalized).toBe(false)
      material.dispose()
      expect(texture.ownership.isFinalized).toBe(true)
    })

    it('disposes a created texture when replaced', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', { width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      material.set('texture', 'baseMap', device.defaultTexture)
      expect(texture.ownership.isFinalized).toBe(true)
    })

    it('keeps acquired textures alive in the pool', () => {
      const material = new BasicMaterial(device, { properties: {} })
      material.set('texture', 'baseMap', { key: 'shared', width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      material.dispose()
      expect(texture.ownership.isOwned).toBe(false)
      expect(texture.ownership.isFinalized).toBe(false)
    })

    it('holds textures assigned later', () => {
      const scope = device.createScope('test')
      const material = scope.adopt(new BasicMaterial(device, { properties: {} }))
      material.set('texture', 'baseMap', { key: 'late', width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      expect(Array.from(scope.walk())).toContain(texture)
      expect(device.scope.has(texture)).toBe(false)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const material = scope.adopt(new BasicMaterial(device, { properties: {} }))
      material.set('texture', 'baseMap', { width: 1, height: 1, source: new Uint8Array(4) })
      const texture = material.get('texture', 'baseMap') as any
      const effect = material.effect
      scope.dispose()
      expect(material.ownership.isFinalized).toBe(true)
      expect(effect.ownership.isFinalized).toBe(true)
      expect(texture.ownership.isFinalized).toBe(true)
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
      expect(geometry.ownership.isFinalized).toBe(true)
      expect(material.ownership.isFinalized).toBe(true)
    })

    it('owns passed in geometries and materials', () => {
      const geometry = new Geometry(device, geometryOptions())
      const material = new BasicMaterial(device, { properties: {} })
      const mesh = new Mesh(device, {
        materials: [material],
        geometries: [geometry],
        parts: [{ geometryIndex: 0, materialIndex: 0 }],
      })
      expect(device.scope.has(geometry)).toBe(false)
      expect(device.scope.has(material)).toBe(false)
      expect(device.scope.has(mesh)).toBe(true)
      mesh.dispose()
      expect(geometry.ownership.isFinalized).toBe(true)
      expect(material.ownership.isFinalized).toBe(true)
    })

    it('keeps the instance when the original is disposed', () => {
      const mesh = createMesh()
      const instance = mesh.instantiate({ materials: false })
      const [geometry] = mesh.geometries
      const [material] = mesh.materials
      mesh.dispose()
      expect(geometry.ownership.isFinalized).toBe(false)
      expect(material.ownership.isFinalized).toBe(false)
      instance.dispose()
      expect(geometry.ownership.isFinalized).toBe(true)
      expect(material.ownership.isFinalized).toBe(true)
    })

    it('keeps the original when an instance is disposed', () => {
      const mesh = createMesh()
      const instance = mesh.instantiate({ materials: true })
      const [geometry] = mesh.geometries
      const [material] = mesh.materials
      const [instanceMaterial] = instance.materials
      instance.dispose()
      expect(geometry.ownership.isFinalized).toBe(false)
      expect(geometry.vertexBuffer.ownership.isFinalized).toBe(false)
      expect(material.ownership.isFinalized).toBe(false)
      expect(instanceMaterial.ownership.isFinalized).toBe(true)
    })

    it('is disposed with its scope', () => {
      const scope = device.createScope('test')
      const mesh = scope.adopt(createMesh())
      const [geometry] = mesh.geometries
      const [material] = mesh.materials
      const vertexBuffer = geometry.vertexBuffer
      scope.dispose()
      expect(mesh.ownership.isFinalized).toBe(true)
      expect(geometry.ownership.isFinalized).toBe(true)
      expect(material.ownership.isFinalized).toBe(true)
      expect(vertexBuffer.ownership.isFinalized).toBe(true)
    })

    it('shares an instance between scopes', () => {
      const a = device.createScope('a')
      const b = device.createScope('b')
      const mesh = a.adopt(createMesh())
      b.adopt(mesh)
      const [geometry] = mesh.geometries
      a.dispose()
      expect(mesh.ownership.isFinalized).toBe(false)
      expect(geometry.ownership.isFinalized).toBe(false)
      b.dispose()
      expect(mesh.ownership.isFinalized).toBe(true)
      expect(geometry.ownership.isFinalized).toBe(true)
    })
  })
}
