import {
  ModelOptions,
  ModelMeshOptions,
  ModelMeshPartOptions,
  PrimitiveType,
  ModelMeshPartUtil,
  BufferOptions,
  nameOfDataType,
  dataTypeSize,
  VertexLayout,
  ArrayType,
  Material,
} from '@gglib/graphics'
import { copy, Log } from '@gglib/utils'
import { BoundingSphere, BoundingBox } from '@gglib/math'
import { PipelineContext } from '@gglib/content'

import { GLTFScene, GLTFMesh, GLTFMeshPrimitive, GLTFAccessorType } from './format'

import { loadGltfAnimations } from './gltfAnimations'
import { loadGltfSkins } from './gltfSkins'
import { GLTFReader } from './reader'
import { loadGltfMaterial } from './gltfMaterials'

export async function loadGltfModel(
  context: PipelineContext,
  reader: GLTFReader,
  scene: GLTFScene,
): Promise<ModelOptions> {

  const result: ModelOptions = {
    cameras: copy(true, reader.doc.cameras),
    roots: copy(true, scene.nodes),
    nodes: copy(true, reader.doc.nodes),
    animations: await loadGltfAnimations(reader),
    meshes: await loadMeshes(context, reader),
    skins: await loadGltfSkins(reader),
  }
  return result
}

async function loadMeshes(context: PipelineContext, reader: GLTFReader): Promise<ModelMeshOptions[]> {
  const result: Array<Promise<ModelMeshOptions>> = reader.doc.meshes.map(async (mesh, meshIndex) => {
    const parts = await loadMeshParts(reader, mesh)

    const materials: Material[] = []
    const mtlMap = new Map<number | string, number>()
    for (const part of parts) {
      const features = analyzeMeshPart(reader, part, meshIndex)
      if (!mtlMap.has(part.materialId)) {
        mtlMap.set(part.materialId, materials.length)
        materials.push(await loadGltfMaterial(context, reader, part.materialId as number, features))
      }
      part.materialId = mtlMap.get(part.materialId)
    }

    return {
      name: mesh.name,
      materials: materials,
      parts: parts,
    }
  })

  return Promise.all(result)
}

function analyzeMeshPart(reader: GLTFReader, part: ModelMeshPartOptions, meshIndex: number) {
  const features: { [key: string]: any } = {}
  const nodes = reader.doc.nodes
    .filter((it) => it.mesh === meshIndex)
  const skins = nodes
    .map((it) => reader.doc.skins?.[it.skin])
    .filter((it) => it != null)

  if (skins.length) {
    features.JointCount = skins[0].joints.length
    features.WeightCount = 4 // TODO: can we get exact number of weight count from file?
  }
  const vb = part.vertexBuffer as BufferOptions[]
  if (vb.some((it) => !!it.layout.color)) {
    features.VertexColor = true
  }
  if (vb.some((it) => !!it.layout.color1)) {
    features.VertexColor1 = true
  }
  if (vb.some((it) => !!it.layout.color2)) {
    features.VertexColor2 = true
  }
  return features
}

async function loadMeshParts(reader: GLTFReader, mesh: GLTFMesh): Promise<ModelMeshPartOptions[]> {
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

async function loadIndexBuffer(reader: GLTFReader, part: GLTFMeshPrimitive): Promise<BufferOptions> {
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

async function loadVertexBuffers(reader: GLTFReader, part: GLTFMeshPrimitive): Promise<BufferOptions[]> {
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
        // glib uses lowercase semantics
        .toLowerCase()
        // e.g. texcoord_0 -> texcoord
        .replace(/_0$/, '')
        // e.g. texcoord_02 -> texcoord2
        .replace(/_(\d+)$/, (_, g) => String(Number(g)))
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

function elementCount(type: GLTFAccessorType) {
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
