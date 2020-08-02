import {
  ModelOptions,
  ModelMeshOptions,
  MaterialOptions,
  ModelMeshPartOptions,
  PrimitiveType,
  ModelMeshPartUtil,
  BufferOptions,
  nameOfDataType,
  dataTypeSize,
  VertexLayout,
  ArrayType,
} from '@gglib/graphics'
import { copy } from '@gglib/utils'
import { BoundingSphere, BoundingBox } from '@gglib/math'

import { PipelineContext } from '../../PipelineContext'
import { DocumentReader, Scene, Mesh, MeshPrimitive, AccessorType } from '../../formats/gltf'

import { loadGltfAnimations } from './gltfAnimations'
import { loadGltfMaterial } from './gltfMaterials'
import { loadGltfSkins } from './gltfSkins'

export async function loadGltfModel(
  context: PipelineContext,
  reader: DocumentReader,
  scene: Scene,
): Promise<ModelOptions> {

  const result: ModelOptions = {
    cameras: copy(true, reader.doc.cameras),
    roots: copy(true, scene.nodes),
    nodes: copy(true, reader.doc.nodes),
    animations: await loadGltfAnimations(reader),
    meshes: await loadMeshes(context, reader),
    skins: await loadGltfSkins(reader),
  }

  for (const node of result.nodes) {
    const mesh = result.meshes[node.mesh] as ModelMeshOptions
    const skin = result.skins[node.skin]
    if (!mesh || !skin) {
      continue
    }
    for (const part of mesh.parts) {
      const mtl = mesh.materials[part.materialId] as MaterialOptions
      if (!mtl) {
        continue
      }
      mtl.parameters.BoneCount = skin.joints.length
      mtl.parameters.WeightCount = 1 // TODO:
    }
  }
  return result
}

async function loadMeshes(context: PipelineContext, reader: DocumentReader): Promise<ModelMeshOptions[]> {
  const result: ModelMeshOptions[] = []
  for (const mesh of reader.doc.meshes) {
    const parts = await loadMeshParts(reader, mesh)
    const mtlMap = new Map<number | string, Promise<MaterialOptions>>()
    for (const part of parts) {
      if (!mtlMap.has(part.materialId)) {
        mtlMap.set(part.materialId, loadGltfMaterial(context, reader, part.materialId as number))
      }
    }

    const materials = Array.from(mtlMap.entries())
    for (const part of parts) {
      part.materialId = materials.findIndex(([id]) => id === part.materialId)
    }

    result.push({
      name: mesh.name,
      materials: await Promise.all(materials.map(([, promise]) => promise)),
      parts: parts,
    })
  }

  return result
}

async function loadMeshParts(reader: DocumentReader, mesh: Mesh): Promise<ModelMeshPartOptions[]> {
  let min = [0, 0, 0]
  let max = [0, 0, 0]
  const doc = reader.doc
  const result = mesh.primitives.map(
    async (part): Promise<ModelMeshPartOptions> => {
      Object.keys(part.attributes).forEach(async (semantic) => {
        const accessor = doc.accessors[part.attributes[semantic]]
        if (semantic === 'POSITION') {
          min = [...accessor.min]
          max = [...accessor.max]
        }
      })

      const iBufferOptions = await loadIndexBuffer(reader, part)
      const vBufferOptions = await loadVertexBuffers(reader, part)
      if (!part.mode || part.mode === PrimitiveType.TriangleList) {
        const util = new ModelMeshPartUtil(iBufferOptions, vBufferOptions, part.mode || PrimitiveType.TriangleList)
        if (!util.hasChannel('normal')) {
          util.calculateNormals(true)
        }
        if (!util.hasChannel('tangent') || !util.hasChannel('bitangent')) {
          util.calculateTangents(true)
        }
      }

      return {
        boundingBox: [...min, ...max],
        boundingSphere: BoundingSphere.createFromBox(BoundingBox.create(...min, ...max)).toArray(),
        materialId: part.material,
        primitiveType: part.mode,
        indexBuffer: iBufferOptions,
        vertexBuffer: vBufferOptions,
      }
    },
  )

  return Promise.all(result)
}

async function loadIndexBuffer(reader: DocumentReader, part: MeshPrimitive): Promise<BufferOptions> {
  if (part.indices == null) {
    return null
  }
  const acc = await reader.loadAccessor(part.indices)
  return {
    data: acc.getDataWithoutOffset(),
    stride: acc.byteStride,
    dataType: acc.componentType as number,
  }
}

async function loadVertexBuffers(reader: DocumentReader, part: MeshPrimitive): Promise<BufferOptions[]> {
  const vbOptions: BufferOptions[] = []
  const bufferViewGroups = new Map<number, string[]>()
  const doc = reader.doc

  for (const attribute of Object.keys(part.attributes)) {
    const accessor = doc.accessors[part.attributes[attribute]]
    if (!bufferViewGroups.has(accessor.bufferView)) {
      bufferViewGroups.set(accessor.bufferView, [])
    }
    bufferViewGroups.get(accessor.bufferView).push(attribute)
  }

  for (const [bufferViewId, attributes] of Array.from(bufferViewGroups.entries())) {
    const bufferView = doc.bufferViews[bufferViewId]
    const buffer = await reader.loadBuffer(bufferView.buffer)

    const bufferOptions: BufferOptions = {
      stride: bufferView.byteStride,
      layout: {},
    }

    for (const attribute of attributes) {
      const accessor = doc.accessors[part.attributes[attribute]]
      const semantic = attribute
        .toLowerCase()
        .replace(/_0$/, '')
        .replace(/^texcoord/, 'texture')

      if (bufferOptions.dataType == null) {
        bufferOptions.dataType = accessor.componentType as number
      } else if (bufferOptions.dataType !== (accessor.componentType as number)) {
        console.warn(
          `interleaved buffer with different component types detected: ${nameOfDataType(
            bufferOptions.dataType as any,
          )}, ${nameOfDataType(accessor.componentType as any)}`,
        )
        if (dataTypeSize(accessor.componentType as any) > dataTypeSize(bufferOptions.dataType)) {
          bufferOptions.dataType = accessor.componentType as number
        }
      }

      bufferOptions.layout[semantic] = {
        type: accessor.componentType as number,
        elements: elementCount(accessor.type),
        normalize: accessor.normalized || false,
        offset: accessor.byteOffset || 0,
      }
    }

    const layoutStride = VertexLayout.countBytes(bufferOptions.layout)
    if (!bufferOptions.stride) {
      // tightly packed buffer
      bufferOptions.stride = layoutStride
    } else if (bufferOptions.stride !== layoutStride) {
      // interlaved buffer, sparse packed
    }

    if (!bufferOptions.data) {
      bufferOptions.data = new ArrayType[bufferOptions.dataType](
        buffer,
        bufferView.byteOffset || 0,
        bufferView.byteLength / dataTypeSize(bufferOptions.dataType),
      )
    }

    vbOptions.push(bufferOptions)
  }

  return vbOptions
}

function elementCount(type: AccessorType) {
  return {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
  }[type]
}
