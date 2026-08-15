import { ResourceRef } from '@gglib/content'
import {
  BufferOptions,
  dataTypeArray,
  dataTypeFromWebGL,
  dataTypeViewReader,
  GeometryUtil,
  MaterialOptions,
  MeshOptions,
  MeshPartImport,
  primitiveTypeFromWebGL,
  TypedArray,
  VertexBufferOptions,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import type { GltfAssetContainer } from './asset'
import {
  accessorByteStride,
  accessorComponentByteSize,
  accessorComponentCount,
  type Document,
  type MeshPrimitive,
} from './format'
import { loadBufferViewAccessor, type BufferViewAccessor } from './load-buffer'

export function loadMesh(asset: GltfAssetContainer, index: number) {
  const graph = asset.graph
  const key = `mesh:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }

  const gltf = asset.document.meshes?.[index]
  if (!gltf) {
    throw new Error(`Mesh with index ${index} not found in document`)
  }

  const node = graph.node<MeshOptions>(key, {
    meta: {},
    geometries: [],
    materials: [],
    parts: [],
  })

  const partMtlRefs = gltf.primitives.map((part) => {
    return graph.dependency(node, asset.materialNode(part.material))
  })

  const partRefs = gltf.primitives.map((part, partIndex): ResourceRef<MeshPartImport> => {
    // index buffer

    let iAccKey: ResourceRef<BufferViewAccessor> = null
    if (part.indices != null) {
      iAccKey = graph.dependency(node, loadBufferViewAccessor(asset, part.indices))
    }

    // vertex buffers

    const partKey = `${key}:part:${partIndex}`
    const partNode = graph.node<MeshPartImport>(partKey, null)
    const partRef = graph.dependency(node, partNode)

    const vAccKeys: Record<string, ResourceRef<BufferViewAccessor>> = {}
    for (const [semantic, index] of Object.entries(part.attributes)) {
      vAccKeys[semantic] = graph.dependency(partNode, loadBufferViewAccessor(asset, index))
    }

    partNode.build = (_, n, get) => {
      const accessors: Record<string, BufferViewAccessor> = {}
      if (iAccKey) {
        accessors['indices'] = get(iAccKey)
      }
      for (const semantic in vAccKeys) {
        accessors[semantic] = get(vAccKeys[semantic])
      }

      return createMeshPart(asset.document, part, accessors)
    }

    return partRef
  })

  node.buildAsync = async (ctx, n, get) => {
    const materials: MaterialOptions[] = []

    const parts = partRefs.map((partKey, index) => {
      const partMtl = get(partMtlRefs[index])
      const part = get(partKey)
      if (!materials.includes(partMtl)) {
        materials.push(partMtl)
      }
      part.materialIndex = materials.indexOf(partMtl)
      return part
    })

    return {
      name: gltf.name,
      meta: { ...(gltf.extras || {}) },
      materials: materials,
      partImports: parts,
      boundingBox: BoundingBox.mergeBoxes(...parts.map((it) => it.geometry.boundingBox)),
      boundingSphere: BoundingSphere.mergeSpheres(...parts.map((it) => it.geometry.boundingSphere)),
    }
  }

  return node
}

function createMeshPart(doc: Document, part: MeshPrimitive, bva: Record<string, BufferViewAccessor>): MeshPartImport {
  let min = [0, 0, 0]
  let max = [0, 0, 0]
  Object.keys(part.attributes).forEach((semantic) => {
    const accessor = doc.accessors[part.attributes[semantic]]
    if (semantic === 'POSITION') {
      min = [...accessor.min]
      max = [...accessor.max]
    }
  })

  const iBufferOptions = createIndexBuffer(bva['indices'])
  const vBufferOptions = createVertexBuffer(part, doc, bva)
  const primitiveType = primitiveTypeFromWebGL(part.mode) || 'TriangleList'
  const isTriangleList = primitiveType === 'TriangleList'
  let hasNormals = false
  let hasTangents = false
  let hasBitangents = false
  let hasTexture = false
  for (const vBuffer of vBufferOptions) {
    hasNormals ||= !!vBuffer.vertexLayout.normal
    hasTangents ||= !!vBuffer.vertexLayout.tangent
    hasBitangents ||= !!vBuffer.vertexLayout.bitangent
    hasTexture ||= !!vBuffer.vertexLayout.texture
  }

  if (isTriangleList && (!hasNormals || !hasTangents || !hasBitangents)) {
    const util = new GeometryUtil(iBufferOptions, vBufferOptions)
    if (!hasNormals) {
      util.calculateNormals({
        create: true,
        update: false,
      })
    }
  }

  return {
    materialIndex: part.material,
    geometry: {
      boundingBox: [...min, ...max],
      boundingSphere: BoundingSphere.createFromBox(BoundingBox.create(...min, ...max)).toArray(),
      primitiveType: primitiveType,
      indexBuffer: iBufferOptions,
      vertexBuffer: vBufferOptions,
    },
  }
}

function createIndexBuffer(bva: BufferViewAccessor): BufferOptions {
  if (bva == null) {
    return null
  }
  const { buffer, view, accessor } = bva

  const byteOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const dataType = dataTypeFromWebGL(accessor.componentType)
  const data = dataTypeArray(dataType, buffer, byteOffset || 0, accessor.count)

  let indexType = dataType
  let indexData = data
  let indexCount = data.length
  if (indexType !== 'uint16' && indexType !== 'uint32') {
    // TODO: for WebGPU this needs to be aligned to 4 bytes
    indexType = 'uint16'
    indexData = new Uint16Array(indexCount)
    for (let i = 0; i < data.length; i++) {
      indexData[i] = data[i]
    }
  }

  return {
    type: 'IndexBuffer',
    data: indexData,
    indexType: indexType,
  }
}

function createVertexBuffer(
  part: MeshPrimitive,
  doc: Document,
  bva: Record<string, BufferViewAccessor>,
): VertexBufferOptions {
  const info = new Map<
    number, // viewIndex
    {
      attributes: string[] // attributes that are using this view
      tightNoGap: boolean // whether attributes are "truly" interleaved
    }
  >()

  for (const attribute of Object.keys(part.attributes)) {
    const { view, accessor } = bva[attribute]
    if (!info.has(accessor.bufferView)) {
      info.set(accessor.bufferView, {
        attributes: [],
        tightNoGap: true,
      })
    }

    info.get(accessor.bufferView).attributes.push(attribute)
    if (view.byteStride == null) {
      // this view data is tightly packed and is not shared with another accessor.
      // qualifies as not having gaps. Data for this stream is sequential and can be just "moved"
      continue
    }

    if (accessor.byteOffset > view.byteStride) {
      // at least one attribute is not truly interleaved, its data is
      info.get(accessor.bufferView).tightNoGap = false
      continue
    }
  }

  const result: VertexBufferOptions = []
  for (const { attributes, tightNoGap } of info.values()) {
    if (tightNoGap) {
      const { buffer, view } = bva[attributes[0]]

      const options: VertexBufferOptions[0] = {
        data: new Uint8Array(buffer, view.byteOffset ?? 0, view.byteLength),
        stride: view.byteStride,
        vertexLayout: {},
      }
      result.push(options)

      for (const attr of attributes) {
        const { accessor } = bva[attr]
        const semantic = getAttributeSemantic(attr)
        options.vertexLayout[semantic] = {
          elementType: dataTypeFromWebGL(accessor.componentType),
          elementCount: accessorComponentCount(accessor.type),
          normalized: accessor.normalized || false,
          byteOffset: accessor.byteOffset ?? 0,
        }
      }
      continue
    }

    for (const attr of attributes) {
      const { accessor } = bva[attr]
      const semantic = getAttributeSemantic(attr)
      result.push({
        data: readAccessorStream(bva[attr]),
        vertexLayout: {
          [semantic]: {
            elementType: dataTypeFromWebGL(accessor.componentType),
            elementCount: accessorComponentCount(accessor.type),
            normalized: accessor.normalized || false,
            byteOffset: 0,
          },
        },
      })
    }
  }

  return result
}

function getAttributeSemantic(name: string) {
  return (
    name
      // glib uses lowercase semantics
      .toLowerCase()
      // e.g. texcoord_0 -> texcoord
      .replace(/_0$/, '')
      // e.g. texcoord_02 -> texcoord2
      .replace(/_(\d+)$/, (_, g) => String(Number(g)))
      .replace(/^texcoord/, 'texture')
  )
}

function readAccessorStream({ buffer, view, accessor }: BufferViewAccessor): TypedArray {
  const dataType = dataTypeFromWebGL(accessor.componentType)
  const byteStride = view.byteStride ?? accessorByteStride(accessor)
  const dataView = new DataView(buffer, (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0))
  const dataReader = dataTypeViewReader(dataType)
  const componentCount = accessorComponentCount(accessor.type)
  const componentSize = accessorComponentByteSize(accessor.componentType)
  const target = dataTypeArray(dataType, accessor.count * componentCount)

  let pos = 0
  let offset = 0
  for (let i = 0; i < accessor.count; i++) {
    offset = i * byteStride
    for (let c = 0; c < componentCount; c++) {
      target[pos] = dataReader(dataView, offset)
      offset += componentSize
      pos++
    }
  }
  return target
}
