import { describe, expect, it } from 'vitest'
import { isAssetIdRef, parseCgf } from './parse'
import { sampleFile } from './testing'
import { CgfStreamType } from './types'

describe('parseCgf', () => {
  it('reads the chunk table', () => {
    const cgf = parseCgf(sampleFile())
    expect(cgf.version).toBe(0x746)
    expect(cgf.chunks.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('rejects other files', () => {
    expect(() => parseCgf(new Uint8Array(16).buffer)).toThrow(/signature/)
  })

  it('reads nodes with translation in meters', () => {
    const [node] = parseCgf(sampleFile()).nodes
    expect(node.name).toBe('root')
    expect(node.objectId).toBe(3)
    expect(node.parentId).toBe(-1)
    expect(Array.from(node.transform.slice(12))).toEqual([1, 2, 3, 1])
    expect(node.properties).toBe('prop=1')
  })

  it('reads meshes and subsets', () => {
    const cgf = parseCgf(sampleFile())
    const mesh = cgf.meshes.get(3)
    expect(mesh.vertexCount).toBe(4)
    expect(mesh.indexCount).toBe(6)
    expect(mesh.streams[CgfStreamType.Positions][0]).toBe(5)
    expect(mesh.streams[CgfStreamType.Tangents][0]).toBe(6)
    expect(mesh.bboxMin).toEqual([-1, -2, -3])
    expect(mesh.bboxMax).toEqual([1, 2, 3])
    const subsets = cgf.subsets.get(mesh.subsetsChunkId)
    expect(subsets.length).toBe(2)
    expect(subsets[1]).toEqual({
      firstIndex: 3,
      numIndices: 3,
      firstVertex: 1,
      numVertices: 3,
      materialId: 1,
      radius: 2,
      center: [1, 1, 1],
    })
  })

  it('reads data refs and inline streams', () => {
    const cgf = parseCgf(sampleFile())
    expect(cgf.dataRefs.get(6)).toEqual({ id: 6, flags: 0, index: 0, offset: 64, size: 64, stride: 16 })
    const stream = cgf.dataStreams.get(7)
    expect(stream.streamType).toBe(CgfStreamType.Indices)
    expect(stream.elementCount).toBe(3)
    expect(stream.elementSize).toBe(2)
    expect(Array.from(new Uint16Array(stream.data.slice().buffer))).toEqual([0, 1, 2])
  })

  it('reads the material reference', () => {
    const cgf = parseCgf(sampleFile())
    expect(cgf.mtlRef).toBe('{0A1B2C3D-0000-1111-2222-333344445555}')
    expect(isAssetIdRef(cgf.mtlRef)).toBe(true)
    expect(isAssetIdRef('/objects/props/stone_mat.mtl')).toBe(false)
    expect(isAssetIdRef('17dw06_props_32x32_mesh_chunk_23_16_1__25541450760.mtl')).toBe(false)
  })
})
