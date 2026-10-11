import { BufferUsage, type BufferOptions, type VertexBufferOptions, type VertexLayout } from '@gglib/graphics'
import type { NodeData } from '@gglib/model'
import { CgfExportFlags, CgfStreamType, type CgfFile, type CgfMesh } from './types'

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
  /**
   * Node hierarchies of the inline levels of detail (`$lodN` nodes), index 0 is level 1
   *
   * @remarks
   * Same nodes and roots as {@link nodes}, but mesh nodes reference the mesh of their `$lodN_<name>` child.
   * A node without a child for a level keeps the mesh of the closest finer level.
   */
  inlineLods: NodeData[][]
  /**
   * Whether the file has levels of detail in sibling files (`<name>_lod1.cgf`, …), see {@link CgfExportFlags.HaveAutoLods}
   */
  haveAutoLods: boolean
  /**
   * Geometric mean of the triangle areas of all rendered meshes, the basis of the level of detail distances
   */
  geometricMeanFaceArea: number
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
 * The meshes of `$lodN` nodes are built as well, {@link CgfGeometryOptions.inlineLods} references them.
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
    inlineLods: [],
    haveAutoLods: !!(cgf.exportFlags & CgfExportFlags.HaveAutoLods),
    geometricMeanFaceArea: 0,
  }

  const nodeIndex = new Map<number, number>()
  cgf.nodes.forEach((node, i) => nodeIndex.set(node.id, i))
  const meshIndex = new Map<number, number>()
  const faceAreas = geometricMeanAccumulator()

  // builds a mesh once, also when several nodes reference it, -1 if it has no renderable data
  const getMeshIndex = (mesh: CgfMesh, nodeName: string) => {
    if (!meshIndex.has(mesh.id)) {
      const options = buildMesh(cgf, heap, mesh, `${name}#${nodeName}`)
      meshIndex.set(mesh.id, options ? result.meshes.push(options) - 1 : -1)
    }
    return meshIndex.get(mesh.id)
  }

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
    const index = getMeshIndex(mesh, node.name)
    if (index >= 0) {
      data.mesh = index
      faceAreas.add(mesh)
    }
  })

  if (isSingleMeshObject(cgf, result.nodes)) {
    // the engine renders the mesh in object space and ignores the node transforms (CStatObj::LoadCGF),
    // e.g. bananaplant: `render_meshes` is rotated to Y-up, its vertices are already Z-up
    for (const node of result.nodes) {
      delete node.matrix
    }
  }

  // inline levels of detail: `$lodN_<name>` children of rendered mesh nodes
  const lodMeshes: Array<Map<number, number>> = []
  cgf.nodes.forEach((node) => {
    const level = inlineLodLevel(node.name)
    const parent = nodeIndex.get(node.parentId)
    if (!level || parent == null || result.nodes[parent].mesh == null) {
      return
    }
    const mesh = cgf.meshes.get(node.objectId)
    const index = mesh ? getMeshIndex(mesh, node.name) : -1
    if (index >= 0) {
      lodMeshes[level] ||= new Map()
      lodMeshes[level].set(parent, index)
    }
  })
  for (let level = 1; level < lodMeshes.length; level++) {
    const nodes = result.nodes.map((node, i) => {
      if (node.mesh == null) {
        return node
      }
      // the closest finer level that has a mesh for this node, level 0 if none
      let mesh = node.mesh
      for (let l = level; l > 0; l--) {
        if (lodMeshes[l]?.has(i)) {
          mesh = lodMeshes[l].get(i)
          break
        }
      }
      return { ...node, mesh }
    })
    result.inlineLods.push(nodes)
  }

  result.geometricMeanFaceArea = faceAreas.result()

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
 * Whether a node is rendered
 *
 * @remarks
 * Not rendered are:
 * - helpers (`$…`) and inline levels of detail (`$lodN_…`, built separately, see {@link inlineLodLevel})
 * - physics proxies, by name like the engine (CGFLoader: `PhysicsProxy`, `$collision`, `$physics_proxy`)
 * - merged collision meshes of old-format files (`Merged_phys`). Newer files name them `$physics_proxy_Merged_phys`.
 *   All `*_phys` mesh nodes in the paks carry physics data, while only 5% of the render meshes do.
 */
export function isRenderNode(name: string) {
  const lower = name.toLowerCase()
  if (lower.startsWith('$') || lower.includes('$lod')) {
    return false
  }
  if (lower.includes('physicsproxy') || lower.includes('$collision') || lower.includes('$physics')) {
    return false
  }
  return !lower.endsWith('_phys')
}

/**
 * Whether the engine loads the file as a single mesh instead of a compound object
 *
 * @remarks
 * Like CStatObj::LoadCGF: all nodes are merged (export flag), or there is at most one mesh node and no `$joint`.
 */
function isSingleMeshObject(cgf: CgfFile, nodes: NodeData[]) {
  if (cgf.exportFlags & CgfExportFlags.MergeAllNodes) {
    return true
  }
  const meshNodes = nodes.filter((node) => node.mesh != null).length
  const hasJoints = cgf.nodes.some((node) => node.name.startsWith('$joint'))
  return meshNodes <= 1 && !hasJoints
}

/**
 * Level of an inline level of detail node (`$lod2_Merged` is level 2), 0 for other nodes
 */
export function inlineLodLevel(name: string): number {
  const match = /^\$lod(\d+)_/i.exec(name)
  return match ? Number(match[1]) : 0
}

/**
 * Merges the geometric mean face areas of several meshes, weighted by their triangle counts (like SMeshLodInfo.Merge)
 *
 * @remarks
 * Older files do not store the face area. Then it is estimated as the bounding box surface divided by the
 * triangle count, which assumes the mesh surface is about the size of its bounding box.
 */
function geometricMeanAccumulator() {
  let logSum = 0
  let count = 0
  return {
    add(mesh: CgfMesh) {
      const triangles = mesh.indexCount / 3
      const area = mesh.geometricMeanFaceArea || boxSurface(mesh) / Math.max(1, triangles)
      if (area > 0 && triangles > 0) {
        logSum += Math.log(area) * triangles
        count += triangles
      }
    },
    result() {
      return count > 0 ? Math.exp(logSum / count) : 0
    },
  }
}

function boxSurface(mesh: CgfMesh) {
  const x = mesh.bboxMax[0] - mesh.bboxMin[0]
  const y = mesh.bboxMax[1] - mesh.bboxMin[1]
  const z = mesh.bboxMax[2] - mesh.bboxMin[2]
  return 2 * (x * y + y * z + z * x)
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
