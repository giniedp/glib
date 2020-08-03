import { Material, Model, ModelBuilder, ModelMeshPartOptions, ModelOptions, VertexLayout } from '@gglib/graphics'
import { addToArraySet } from '@gglib/utils'
import { loader, resolveUri } from '@gglib/content'

import { Data, FaceElement, OBJ, VertexTextureNormalRef } from './format'

/**
 * @public
 */
export const loadObjToModelOptions = loader({
  input: ['.obj', 'application/x-obj'],
  output: Model.Options,
  handle: async (_, context): Promise<ModelOptions> => {

    const content = (await context.manager.downloadText(context.source)).content
    const data = OBJ.parse(content)

    const mtllib = new Set<string>()
    const groups = new Map<string, Map<number, FaceElement[]>>()

    data.f.forEach((face) => {

      (face.state.mtllib || []).forEach((name) => mtllib.add(name))

      face.group.g.forEach((g) => {
        const s = face.group.s
        let group = groups.get(g)
        if (!group) {
          group = new Map<number, FaceElement[]>()
          groups.set(g, group)
        }
        let sGroup = group.get(s)
        if (!sGroup) {
          sGroup = []
          group.set(s, sGroup)
        }
        sGroup.push(face)
      })
    })

    const parts: ModelMeshPartOptions[] = []
    groups.forEach((group, g) => {
      group.forEach((faces, s) => {
        parts.push(...buildGroup(data, faces, s))
      })
    })

    const materials = await Promise.all(Array.from(mtllib.values()).map((file) => {
      const uri = resolveUri(file, context)
      return context.manager.load<Material[]>(uri, Material.Array)
    })).then((value) => {
      return value.reduce((sum, b) => {
        sum.push(...b)
        return sum
      }, [])
    })
    return {
      meshes: [{
        materials: materials,
        parts: parts,
      }]
    }
  },
})

function readVertex<T>(data: Data, element: VertexTextureNormalRef, target: T) {
  const result = target as T & {
    position?: number[],
    texture?: number[],
    normal?: number[],
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

function buildGroup(data: Data, faces: FaceElement[], smoothingGroup: number) {
  const builder = ModelBuilder.begin({
    layout: [
      VertexLayout.convert('PositionTexture'),
      VertexLayout.convert('Normal'),
      VertexLayout.convert('TangentBitangent'),
      // we abuse an attribute channel as metadata for a material id
      // so we can later split by material
      {
        material: {
          elements: 1,      // - we dont care about this
          offset: 0,        // - and this
          packed: false,    // - and this
          normalize: false, // - and this
          type: 'float',    // - and this since we dont operate on this buffer
        },
      },
    ],
  })

  let hasNormals = true
  let vertices = new Map<string, number>()
  let mtlNames: string[] = []
  function addVertex(ref: VertexTextureNormalRef, mtl: number) {
    let key = [ref.v, ref.vn, ref.vt, mtl].join('-')
    if (!vertices.has(key)) {
      vertices.set(key, builder.vertexCount)
      builder.addVertex(readVertex(data, ref, {
        material: [mtl],
      }))
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
      addToArraySet(mtlNames, f.state.usemtl)
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
  const split = new Map<number, {
    builder: ModelBuilder,
    indexMap: Map<number, number>,
  }>()

  builder.indices.forEach((index) => {
    const vertex = builder.readVertex(index)
    const materialId: number = vertex.material[0]
    delete vertex.material

    if (!split.has(materialId)) {
      split.set(materialId, {
        builder: ModelBuilder.begin({
          layout: [
            'PositionTexture',
            'Normal',
            'TangentBitangent',
          ],
        }),
        indexMap: new Map<number, number>(),
      })
    }

    const mesh = split.get(materialId)
    if (mesh.builder.indexCount % 3 === 0 && mesh.builder.vertexCount >= (65536 - 2)) {
      mesh.indexMap.clear()
      result.push(
        mesh.builder
          .calculateBoundings()
          .endMeshPart({
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
        entry.builder
          .calculateBoundings()
          .endMeshPart({
            materialId: mtl,
          }),
      )
    }
  })

  return result
}
