import { describe, expect, it } from 'vitest'
import { buildCgfGeometryOptions, isRenderNode, tangentFrameWithNormal } from './geometry'
import { parseCgf } from './parse'
import { CgfWriter, IDENTITY_CM, sampleFile, writeMesh, writeNode } from './testing'
import { CgfChunkType, CgfStreamType } from './types'

const S = 32767

/**
 * Heap of {@link sampleFile}: 4 interleaved vertices (16 bytes) at 0, 4 tangent frames at 64
 */
function sampleHeap() {
  const heap = new Uint8Array(128)
  const view = new DataView(heap.buffer)
  for (let i = 0; i < 4; i++) {
    const at = 64 + i * 16
    // tangent +x, handedness +1 for the first 2 vertices, -1 for the others
    view.setInt16(at, S, true)
    view.setInt16(at + 6, i < 2 ? S : -S, true)
    // bitangent +y
    view.setInt16(at + 10, S, true)
  }
  return heap
}

describe('tangentFrameWithNormal', () => {
  it('replaces the bitangent with the normal and keeps the tangent', () => {
    const heap = sampleHeap()
    const frame = tangentFrameWithNormal({ bytes: heap.subarray(64), count: 4 })
    // cross(+x, +y) = +z, flipped by the handedness
    expect(Array.from(frame.slice(0, 8))).toEqual([S, 0, 0, S, 0, 0, S, 0])
    expect(Array.from(frame.slice(24, 32))).toEqual([S, 0, 0, -S, 0, 0, -S, 0])
  })

  it('does not modify the source', () => {
    const heap = sampleHeap()
    tangentFrameWithNormal({ bytes: heap.subarray(64), count: 4 })
    expect(new DataView(heap.buffer).getInt16(64 + 10, true)).toBe(S)
  })
})

describe('buildCgfGeometryOptions', () => {
  it('uses the interleaved heap stream as is', () => {
    const options = buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap())
    expect(options.mtlRef).toBe('{0A1B2C3D-0000-1111-2222-333344445555}')
    expect(options.meshes.length).toBe(1)
    const mesh = options.meshes[0]
    expect(mesh.vertexCount).toBe(4)
    expect(mesh.boundingBox).toEqual([-1, -2, -3, 1, 2, 3])
    expect(mesh.vertexBuffer[0].stride).toBe(16)
    expect(mesh.vertexBuffer[0].layout).toEqual({
      position: { type: 'float16x4', byteOffset: 0 },
      color: { type: 'unorm8x4-bgra', byteOffset: 8 },
      texture: { type: 'float16x2', byteOffset: 12 },
    })
    expect((mesh.vertexBuffer[0].data as Uint8Array).byteLength).toBe(64)
    expect(mesh.vertexBuffer[1].layout).toEqual({
      tangent: { type: 'snorm16x4', byteOffset: 0 },
      normal: { type: 'snorm16x4', byteOffset: 8 },
    })
  })

  it('pads odd index counts and keeps the subset ranges', () => {
    const mesh = buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap()).meshes[0]
    expect(mesh.indexBuffer.indexType).toBe('uint16')
    expect(Array.from(mesh.indexBuffer.data as Uint16Array)).toEqual([0, 1, 2, 0])
    expect(mesh.subsets).toEqual([
      { indexOffset: 0, indexCount: 3, materialId: 0 },
      { indexOffset: 3, indexCount: 3, materialId: 1 },
    ])
  })

  it('keeps the node transform as stored, translation in meters', () => {
    const options = buildCgfGeometryOptions(parseCgf(sampleFile()), sampleHeap())
    expect(options.roots).toEqual([0])
    expect(options.nodes[0].mesh).toBe(0)
    expect(options.nodes[0].matrix.slice(12)).toEqual([1, 2, 3, 1])
  })

  it('skips meshes without heap data', () => {
    const options = buildCgfGeometryOptions(parseCgf(sampleFile()), null)
    expect(options.meshes.length).toBe(0)
    expect(options.nodes[0].mesh).toBeUndefined()
  })

  it('gives helper and lod nodes no mesh but keeps them in the hierarchy', () => {
    // prettier-ignore
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    const file = new CgfWriter()
      .chunk(CgfChunkType.Node, 0x0824, 1, (w) => writeNode(w, 'root', 4, -1, IDENTITY_CM))
      .chunk(CgfChunkType.Node, 0x0824, 2, (w) => writeNode(w, '$lod1', 4, 1, identity))
      .chunk(CgfChunkType.Node, 0x0824, 3, (w) => writeNode(w, '$physics_proxy', 4, 1, identity))
      .chunk(CgfChunkType.Mesh, 0x0802, 4, (w) =>
        writeMesh(w, {
          verts: 4,
          indices: 4,
          subsetsId: 5,
          streams: { [CgfStreamType.Positions]: 6, [CgfStreamType.Indices]: 7 },
        }),
      )
      .chunk(CgfChunkType.MeshSubsets, 0x0800, 5, (w) => w.i32(0, 1).i32(0, 0).i32(0, 4, 0, 4, 0).f32(1, 0, 0, 0))
      .chunk(CgfChunkType.DataRef, 0x0800, 6, (w) => w.i32(0, 0, 0, 96, 24))
      .chunk(CgfChunkType.DataRef, 0x0800, 7, (w) => w.i32(0, 0, 96, 8, 2))
      .build()
    const options = buildCgfGeometryOptions(parseCgf(file), new Uint8Array(128))
    expect(options.nodes.map((n) => [n.name, n.mesh])).toEqual([
      ['root', 0],
      ['$lod1', undefined],
      ['$physics_proxy', undefined],
    ])
    expect(options.nodes[0].children).toEqual([1, 2])
    expect(options.nodes[1].matrix).toBeUndefined()
    // 24 byte layout, no tangents
    expect(options.meshes[0].vertexBuffer.length).toBe(1)
    expect(options.meshes[0].vertexBuffer[0].layout.position.type).toBe('float32x3')
  })

  it('detects render nodes like nwbt', () => {
    expect(isRenderNode('Merged')).toBe(true)
    expect(isRenderNode('$lod2')).toBe(false)
    expect(isRenderNode('piece$lod1')).toBe(false)
    expect(isRenderNode('$auto_0')).toBe(false)
    expect(isRenderNode('mesh$physics')).toBe(false)
  })
})
