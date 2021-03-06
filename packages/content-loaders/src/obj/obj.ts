import {
  Material,
  Model,
  ModelBuilder,
  ModelMeshPartOptions,
  ModelOptions,
  VertexLayout,
  MaterialOptions,
} from '@gglib/graphics'
import { loader, resolveUri, Loader } from '@gglib/content'

import { OBJ, FaceElement, VertexTextureNormalRef } from './format'
import { PipelineContext } from '@gglib/content'
import { addToArraySet, flattenArray } from '@gglib/utils'

/**
 * Downloads text from source, parses it using {@link OBJ.parse} and converts into {@link ModelOptions}.
 * @public
 * @remarks
 * This loader consults the `OBJ` -> `ModelOptions.Options` loader if available.
 */
export const loadObjToModelOptions: Loader<string, ModelOptions> = loader({
  input: ['.obj', 'application/x-obj'],
  output: Model.Options,
  handle: async (_, context): Promise<ModelOptions> => {
    const content = (await context.manager.downloadText(context.source)).content
    const data = OBJ.parse(content)
    if (context.pipeline.canLoad(OBJ, Model.Options)) {
      const result = await context.pipeline.run(OBJ, Model.Options, data, context)
      if (result) {
        return result
      }
    }
    return convertData(data, context)
  },
})

async function convertData(data: OBJ, context: PipelineContext) {
  const groups = new Map<string, Map<number, FaceElement[]>>()
  const mtllibs: string[] = []
  const usemtls: string[] = []

  for (const face of data.f) {
    for (const mtl of face.state.mtllib || []) {
      addToArraySet(mtllibs, mtl)
    }
    if (face.state.usemtl) {
      addToArraySet(usemtls, face.state.usemtl)
    }
    for (const g of face.group.g) {
      const s = face.group.s
      if (!groups.has(g)) {
        groups.set(g, new Map<number, FaceElement[]>())
      }
      const group = groups.get(g)
      if (!group.has(s)) {
        group.set(s, [])
      }
      const sGroup = group.get(s)
      sGroup.push(face)
    }
  }

  const materials = (await loadMtllibs(mtllibs, context)).filter((mtl) => {
    return usemtls.indexOf(mtl.name) >= 0
  })
  const mtlNames = materials.map((it) => it.name)
  const parts: ModelMeshPartOptions[] = []
  groups.forEach((group, g) => {
    group.forEach((faces, s) => {
      parts.push(...buildGroup(data, faces, s, mtlNames))
    })
  })

  return {
    meshes: [
      {
        materials: materials,
        parts: parts,
      },
    ],
  }
}

async function loadMtllibs(files: string[], context: PipelineContext) {
  return Promise.all(files.map((file) => loadMtllib(file, context))).then(flattenArray)
}
function loadMtllib(file: string, context: PipelineContext) {
  return context.manager.load<MaterialOptions[]>(resolveUri(file, context), Material.OptionsArray)
}

function readVertex<T>(data: OBJ, element: VertexTextureNormalRef, target: T) {
  const result = target as T & {
    position?: number[]
    texture?: number[]
    normal?: number[]
  }
  if (data.v != null && data.v[element.v] != null) {
    result.position = data.v[element.v]
  }
  if (element.vt != null && data.vt != null) {
    result.texture = data.vt[element.vt]
  }
  if (element.vn != null && data.vn != null) {
    result.normal = data.vn[element.vn]
  }
  return result
}

function buildGroup(data: OBJ, faces: FaceElement[], smoothingGroup: number, mtlNames: string[]) {
  const builder = ModelBuilder.begin({
    layout: [
      VertexLayout.convert('PositionTexture'),
      VertexLayout.convert('Normal'),
      VertexLayout.convert('TangentBitangent'),
      // we abuse an attribute channel as metadata for a material id
      // so we can later split by material
      {
        material: {
          elements: 1, // - we dont care about this
          offset: 0, // - and this
          packed: false, // - and this
          normalize: false, // - and this
          type: 'float', // - and this since we dont operate on this buffer
        },
      },
    ],
  })

  let hasNormals = true
  let vertices = new Map<string, number>()
  function addVertex(ref: VertexTextureNormalRef, mtl: number) {
    let key = [ref.v, ref.vn, ref.vt, mtl].join('-')
    if (!vertices.has(key)) {
      vertices.set(key, builder.vertexCount)
      builder.addVertex(
        readVertex(data, ref, {
          material: [mtl],
        }),
      )
      if (ref.vn == null) {
        hasNormals = false
      }
    }
    builder.addIndex(vertices.get(key))
  }

  for (const f of faces) {
    let count = 0
    while (count < f.data.length - 2) {
      count++
      const mtlIndex = mtlNames.indexOf(f.state.usemtl)
      addVertex(f.data[0], mtlIndex)
      addVertex(f.data[count], mtlIndex)
      addVertex(f.data[count + 1], mtlIndex)
    }
  }

  if (!hasNormals) {
    builder.calculateNormals()
  }
  builder.calculateTangents()

  return splitByMaterial(builder, mtlNames)
}

function splitByMaterial(builder: ModelBuilder, mtlNames: string[]): ModelMeshPartOptions[] {
  const result: ModelMeshPartOptions[] = []
  const split = new Map<
    number,
    {
      builder: ModelBuilder
      indexMap: Map<number, number>
    }
  >()

  builder.indices.forEach((index) => {
    const vertex = builder.readVertex(index)
    const materialId: number = vertex.material[0]
    delete vertex.material

    if (!split.has(materialId)) {
      split.set(materialId, {
        builder: ModelBuilder.begin({
          layout: ['PositionTexture', 'Normal', 'TangentBitangent'],
        }),
        indexMap: new Map<number, number>(),
      })
    }

    const mesh = split.get(materialId)
    if (mesh.builder.indexCount % 3 === 0 && mesh.builder.vertexCount >= 65536 - 2) {
      mesh.indexMap.clear()
      result.push(
        mesh.builder.calculateBoundings().endMeshPart({
          materialId: mtlNames[materialId],
        }),
      )
    }

    let remapped = mesh.indexMap.get(index)
    if (remapped == null) {
      remapped = mesh.builder.vertexCount
      mesh.indexMap.set(index, remapped)
      mesh.builder.addVertex(vertex)
    }
    mesh.builder.addIndex(remapped)
  })

  split.forEach((entry, mtl) => {
    if (entry.builder.vertexCount > 0) {
      result.push(
        entry.builder.calculateBoundings().endMeshPart({
          materialId: mtl,
        }),
      )
    }
  })

  return result
}
