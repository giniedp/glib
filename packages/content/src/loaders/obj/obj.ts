import { Material, Model, ModelBuilder, ModelMeshOptions, ModelOptions, VertexLayout } from '@gglib/graphics'

import { Data, FaceElement, OBJ, VertexTextureNormalRef } from '../../formats/obj'
import { loader, resolveUri } from '../../utils'

export const objToModelOptions = loader<null, ModelOptions>({
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

function readVertex<T = any>(data: Data, element: VertexTextureNormalRef, target: T): T & {
  position: number[],
  texture?: number[],
  normal?: number[],
} {
  target['position'] = data.v[element.v]
  if (element.vt != null && data.vt != null) {
    target['texture'] = data.vt[element.vt]
  }
  if (element.vn != null && data.vn != null) {
    target['normal'] = data.vn[element.vn]
  }
  return target as any
}

function buildGroup(data: Data, faces: FaceElement[], smoothingGroup: number) {
  let builder = ModelBuilder.begin({
    layout: [
      VertexLayout.convert('PositionTexture'),
      VertexLayout.convert('Normal'),
      VertexLayout.convert('TangentBitangent'),
      // metadata channel
      // allows us to split the mesh by material later
      {
        material: {
          elements: 1,
          offset: 0,
          packed: false,
          normalize: false,
          type: 'float', // FIXME: actually it's a string, but the implementation does not care
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
  const byMtl = new Map<string, {
    builder: ModelBuilder,
    indexMap: Map<number, number>,
  }>()

  builder.indices.forEach((index) => {
    const mtl = builder.getChannel('material').read(index, 0) as any
    if (!byMtl.has(mtl)) {
      byMtl.set(mtl, {
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

    const mesh = byMtl.get(mtl)
    if (index % 3 === 0 && mesh.builder.vertexCount >= (65536 - 2)) {
      mesh.indexMap.clear()
      result.push(mesh.builder
      .calculateBoundings()
      .endMesh({
        materialId: mtl,
      }))
    }

    let newIndex = mesh.indexMap.get(index)
    if (newIndex == null) {
      newIndex = mesh.builder.vertexCount
      mesh.indexMap.set(index, newIndex)
      mesh.builder.addVertex({
        position: builder.getChannel('position').readAttribute(index),
        texture: builder.getChannel('texture').readAttribute(index),
        normal: builder.getChannel('normal').readAttribute(index),
        tangent: builder.getChannel('tangent').readAttribute(index),
        bitangent: builder.getChannel('bitangent').readAttribute(index),
      })
    }
    mesh.builder.addIndex(newIndex)
  })

  byMtl.forEach((entry, mtl) => {
    if (entry.builder.vertexCount > 0) {
      result.push(entry.builder
      .calculateBoundings()
      .endMesh({
        materialId: mtl,
      }))
    }
  })

  return result
}
