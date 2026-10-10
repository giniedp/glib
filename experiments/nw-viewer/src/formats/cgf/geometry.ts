import { BufferUsage, type BufferOptions, type VertexBufferOptions, type VertexLayout } from '@gglib/graphics'
import type { NodeData } from '@gglib/model'
import { CgfStreamType, type CgfFile, type CgfMesh } from './types'

/**
 * CPU side data of the static geometry of a `.cgf` file, ready for upload
 *
 * @remarks
 * Vertex data is taken from the `.cgfheap` as it is (no conversion), see {@link buildCgfGeometryOptions}
 */
export interface CgfGeometryOptions {
  /**
   * Material reference of the file (asset id or path), the material used when the caller has no override
   */
  mtlRef: string | null
  /**
   * The node hierarchy, nodes reference {@link CgfGeometryOptions.meshes} by index
   */
  nodes: NodeData[]
  /**
   * Indices of the root nodes
   */
  roots: number[]
  meshes: CgfMeshOptions[]
}

export interface CgfMeshOptions {
  name: string
  /**
   * Local bounding box: min xyz, max xyz
   */
  boundingBox: number[]
  vertexBuffer: VertexBufferOptions
  indexBuffer: BufferOptions
  vertexCount: number
  /**
   * The parts of the mesh, each one is drawn with a single material
   */
  subsets: CgfSubsetOptions[]
}

export interface CgfSubsetOptions {
  indexOffset: number
  indexCount: number
  /**
   * Index into the material collection of the `.mtl` file
   */
  materialId: number
}

interface StreamData {
  /**
   * Chunk id, streams that share a chunk are interleaved
   */
  id: number
  bytes: Uint8Array<ArrayBuffer>
  stride: number
  count: number
  inline: boolean
}

// heap layout of the interleaved position, color and texcoord stream (P3S_C4B_T2S, P3F_C4B_T2F)
const INTERLEAVED_LAYOUTS: Record<number, VertexLayout> = {
  16: {
    position: { type: 'float16x4', byteOffset: 0 },
    color: { type: 'unorm8x4-bgra', byteOffset: 8 },
    texture: { type: 'float16x2', byteOffset: 12 },
  },
  24: {
    position: { type: 'float32x3', byteOffset: 0 },
    color: { type: 'unorm8x4-bgra', byteOffset: 12 },
    texture: { type: 'float32x2', byteOffset: 16 },
  },
}

// separate streams of the inline format
const POSITION_TYPES = { 8: 'float16x4', 12: 'float32x3' } as const
const TEXCOORD_TYPES = { 4: 'float16x2', 8: 'float32x2' } as const

/**
 * Builds the geometry options of a parsed `.cgf` file
 *
 * @remarks
 * Nodes are kept with their transform. Helper (`$…`) and LOD (`$lodN`) nodes get no mesh, like the nwbt glTF
 * conversion with `no-lod`. Node transforms are used as stored: the cgf `tm` has the glTF layout.
 *
 * @param cgf - the parsed file
 * @param heap - content of the `.cgfheap` file, null for the inline format
 */
export function buildCgfGeometryOptions(cgf: CgfFile, heap: Uint8Array<ArrayBuffer> | null, name = ''): CgfGeometryOptions {
  const result: CgfGeometryOptions = {
    mtlRef: cgf.mtlRef,
    nodes: [],
    roots: [],
    meshes: [],
  }

  const nodeIndex = new Map<number, number>()
  cgf.nodes.forEach((node, i) => nodeIndex.set(node.id, i))
  const meshIndex = new Map<number, number>()

  cgf.nodes.forEach((node, i) => {
    const data: NodeData = { name: node.name }
    if (!isIdentity(node.transform)) {
      data.matrix = Array.from(node.transform)
    }
    result.nodes.push(data)

    const parent = nodeIndex.get(node.parentId)
    if (node.parentId === -1 || parent == null) {
      result.roots.push(i)
    }

    if (!isRenderNode(node.name)) {
      return
    }
    const mesh = cgf.meshes.get(node.objectId)
    if (!mesh) {
      return
    }
    if (!meshIndex.has(mesh.id)) {
      const options = buildMesh(cgf, heap, mesh, `${name}#${node.name}`)
      meshIndex.set(mesh.id, options ? result.meshes.push(options) - 1 : -1)
    }
    const index = meshIndex.get(mesh.id)
    if (index >= 0) {
      data.mesh = index
    }
  })

  // children in node order, nodes with an unknown parent are roots (see above)
  cgf.nodes.forEach((node, i) => {
    const parent = nodeIndex.get(node.parentId)
    if (node.parentId !== -1 && parent != null) {
      const p = result.nodes[parent]
      p.children = p.children || []
      p.children.push(i)
    }
  })
  return result
}

/**
 * Whether a node is rendered: no helper (`$…`, `$physics`) and no inline LOD (`$lodN`)
 */
export function isRenderNode(name: string) {
  return !name.startsWith('$') && !name.includes('$physics') && !name.includes('$lod')
}

function buildMesh(cgf: CgfFile, heap: Uint8Array<ArrayBuffer> | null, mesh: CgfMesh, name: string): CgfMeshOptions | null {
  const subsets = cgf.subsets.get(mesh.subsetsChunkId)
  const positions = getStream(cgf, heap, mesh, CgfStreamType.Positions)
  const indices = getStream(cgf, heap, mesh, CgfStreamType.Indices)
  if (!subsets?.length || !positions || !indices) {
    return null
  }

  const buffers: VertexBufferOptions = []
  const texcoords = getStream(cgf, heap, mesh, CgfStreamType.TexCoords)
  const colors = getStream(cgf, heap, mesh, CgfStreamType.Colors)
  if (!positions.inline) {
    const layout = INTERLEAVED_LAYOUTS[positions.stride]
    if (!layout) {
      console.warn(`cgf ${name}: unsupported position stride ${positions.stride}`)
      return null
    }
    buffers.push(vertexBuffer(positions, layout))
  } else {
    const type = POSITION_TYPES[positions.stride]
    if (!type) {
      console.warn(`cgf ${name}: unsupported position size ${positions.stride}`)
      return null
    }
    buffers.push(vertexBuffer(positions, { position: { type, byteOffset: 0 } }))
    if (texcoords && TEXCOORD_TYPES[texcoords.stride]) {
      buffers.push(vertexBuffer(texcoords, { texture: { type: TEXCOORD_TYPES[texcoords.stride], byteOffset: 0 } }))
    }
    if (colors?.stride === 4) {
      buffers.push(vertexBuffer(colors, { color: { type: 'unorm8x4-bgra', byteOffset: 0 } }))
    }
  }

  const tangents = getStream(cgf, heap, mesh, CgfStreamType.Tangents)
  const normals = getStream(cgf, heap, mesh, CgfStreamType.Normals)
  if (tangents?.stride === 16) {
    buffers.push({
      usage: BufferUsage.VERTEX,
      layout: {
        tangent: { type: 'snorm16x4', byteOffset: 0 },
        normal: { type: 'snorm16x4', byteOffset: 8 },
      },
      stride: 16,
      data: tangentFrameWithNormal(tangents),
    })
  } else if (normals?.stride === 12) {
    buffers.push(vertexBuffer(normals, { normal: { type: 'float32x3', byteOffset: 0 } }))
  }

  return {
    name,
    boundingBox: [...mesh.bboxMin, ...mesh.bboxMax],
    vertexBuffer: buffers,
    indexBuffer: indexBuffer(indices),
    vertexCount: positions.count,
    subsets: subsets.map((s) => ({
      indexOffset: s.firstIndex,
      indexCount: s.numIndices,
      materialId: s.materialId,
    })),
  }
}

function getStream(cgf: CgfFile, heap: Uint8Array<ArrayBuffer> | null, mesh: CgfMesh, type: number): StreamData | null {
  const id = mesh.streams[type]?.[0]
  if (!id) {
    return null
  }
  const ref = cgf.dataRefs.get(id)
  if (ref) {
    if (!heap || ref.offset + ref.size > heap.byteLength) {
      return null
    }
    return {
      id,
      bytes: heap.subarray(ref.offset, ref.offset + ref.size),
      stride: ref.stride,
      count: Math.floor(ref.size / ref.stride),
      inline: false,
    }
  }
  const stream = cgf.dataStreams.get(id)
  if (stream) {
    return {
      id,
      // inline data has no alignment guarantee within the chunk file
      bytes: stream.data.slice(),
      stride: stream.elementSize,
      count: stream.elementCount,
      inline: true,
    }
  }
  return null
}

function vertexBuffer(stream: StreamData, layout: VertexLayout): BufferOptions {
  return {
    usage: BufferUsage.VERTEX,
    layout,
    stride: stream.stride,
    data: stream.bytes,
  }
}

function indexBuffer(stream: StreamData): BufferOptions {
  const indexType = stream.stride === 4 ? 'uint32' : 'uint16'
  let bytes = stream.bytes
  if (bytes.byteLength % 4 !== 0 || bytes.byteOffset % 4 !== 0) {
    // WebGPU writes need 4 byte multiples, odd u16 index counts are padded
    const padded = new Uint8Array(Math.ceil(bytes.byteLength / 4) * 4)
    padded.set(bytes)
    bytes = padded
  }
  return {
    usage: BufferUsage.INDEX,
    indexType,
    data: indexType === 'uint32' ? new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4) : new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2),
  }
}

/**
 * Copies the tangent stream (tangent and bitangent as snorm16x4) and replaces the bitangent with the normal
 *
 * @remarks
 * normal = normalize(cross(tangent, bitangent)) * sign(tangent.w), as in the nwbt glTF conversion.
 * The result keeps the 16 byte stride: tangent snorm16x4 at 0, normal snorm16x4 at 8.
 *
 * TODO(cgf-shader): remove this CPU pass. Bind the bitangent (`snorm16x4` at 8) and reconstruct the normal in the
 * vertex shader, then the heap slice can be uploaded untouched. Needs a shared vertex helper for all material shaders.
 */
export function tangentFrameWithNormal(stream: { bytes: Uint8Array; count: number }): Int16Array<ArrayBuffer> {
  const src = new Int16Array(stream.bytes.slice().buffer)
  const out = src
  for (let i = 0; i < stream.count; i++) {
    const o = i * 8
    const tx = src[o]
    const ty = src[o + 1]
    const tz = src[o + 2]
    const tw = src[o + 3]
    const bx = src[o + 4]
    const by = src[o + 5]
    const bz = src[o + 6]
    let nx = ty * bz - tz * by
    let ny = tz * bx - tx * bz
    let nz = tx * by - ty * bx
    const len = Math.hypot(nx, ny, nz)
    const s = len > 0 ? (tw < 0 ? -32767 : 32767) / len : 0
    nx *= s
    ny *= s
    nz *= s
    out[o + 4] = Math.round(nx)
    out[o + 5] = Math.round(ny)
    out[o + 6] = Math.round(nz)
    out[o + 7] = 0
  }
  return out
}

function isIdentity(m: ArrayLike<number>) {
  for (let i = 0; i < 16; i++) {
    if (m[i] !== (i % 5 === 0 ? 1 : 0)) {
      return false
    }
  }
  return true
}
