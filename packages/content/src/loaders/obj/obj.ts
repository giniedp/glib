import { Material, Model, ModelBuilder, ModelMeshOptions, ModelOptions, VertexLayout } from '@gglib/graphics'

import { Data, FaceElement, OBJ, VertexTextureNormalRef } from '../../formats/obj'
import { loader, resolveUri } from '../../utils'

/**
 * @public
 */
export const loadObjToModelOptions = loader<null, ModelOptions>({
  input: ['.obj', 'application/x-obj'],
  output: Model.Options,
  handle: async (_, context) => {

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

    const meshes: ModelMeshOptions[] = []
    groups.forEach((group, g) => {
      group.forEach((faces, s) => {
        meshes.push(...buildGroup(data, faces, s))
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
      materials: materials,
      meshes: meshes,
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
  let builder = ModelBuilder.begin({
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
  function addVertex(ref: VertexTextureNormalRef, mtl: string) {
    let key = [ref.v, ref.vn, ref.vt, mtl].join('-')
    if (!vertices.has(key)) {
      vertices.set(key, builder.vertexCount)
      builder.addVertex(readVertex(data, ref, {
        material: [mtl as any],
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
      addVertex(f.data[0], f.state.usemtl)
      addVertex(f.data[count], f.state.usemtl)
      addVertex(f.data[count + 1], f.state.usemtl)
    }
  }

  if (!hasNormals) {
    builder.calculateNormals()
  }
  builder.calculateTangents()

  return splitByMaterial(builder)
}

function splitByMaterial(builder: ModelBuilder): ModelMeshOptions[] {
  const result: ModelMeshOptions[] = []
  const split = new Map<string, {
    builder: ModelBuilder,
    indexMap: Map<number, number>,
  }>()

  const position = builder.getChannel('position')
  const texture = builder.getChannel('texture')
  const normal = builder.getChannel('normal')
  const tangent = builder.getChannel('tangent')
  const bitangent = builder.getChannel('bitangent')
  const material = builder.getChannel('material')

  builder.indices.forEach((index) => {
    const materialId: string = material.read(index, 0) as any
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
          .endMesh({
            materialId: materialId,
          }),
      )
    }

    let remapped = mesh.indexMap.get(index)
    if (remapped == null) {
      remapped = mesh.builder.vertexCount
      mesh.indexMap.set(index, remapped)
      mesh.builder.addVertex({
        position: position.readAttribute(index),
        texture: texture.readAttribute(index),
        normal: normal.readAttribute(index),
        tangent: tangent.readAttribute(index),
        bitangent: bitangent.readAttribute(index),
      })
    }
    mesh.builder.addIndex(remapped)
  })

  split.forEach((entry, mtl) => {
    if (entry.builder.vertexCount > 0) {
      result.push(
        entry.builder
          .calculateBoundings()
          .endMesh({
            materialId: mtl,
          }),
      )
    }
  })

  return result
}
