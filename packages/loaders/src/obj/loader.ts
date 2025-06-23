import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { GeometryBuilder, GeometryOptions, MaterialOptions, VertexLayout } from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { addToArraySet } from '@gglib/utils'
import { Document, FaceElement, VertexTextureNormalRef, parse } from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions = ['.obj']
  public static mimeTypes = ['application/x-obj']
  public static loader = Loader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const data = parse(response.body)
    return this.convert(data, context)
  }

  public async convert(document: Document, context: LoaderContext): Promise<AssetContainer> {
    const result: AssetContainer = {
      source: context.assetUrl,
    }

    const groups = new Map<string, Map<number, FaceElement[]>>()
    const mtllibs: string[] = []
    const usemtls: string[] = []

    for (const face of document.f) {
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

    const materials: MaterialOptions[] = await this.loadMaterialLibs(mtllibs, context)
    const mtlNames = materials.map((it) => it.name)
    const geometries: GeometryOptions[] = []
    let box: BoundingBox
    function mergeBox(o: GeometryOptions) {
      if (!o.boundingBox) {
        return
      }
      if (!box) {
        box = BoundingBox.convert(o.boundingBox).clone()
      } else {
        box.merge(BoundingBox.convert(o.boundingBox))
      }
    }

    let sphere: BoundingSphere
    function mergeSphere(o: GeometryOptions) {
      if (!o.boundingSphere) {
        return
      }
      if (!sphere) {
        sphere = BoundingSphere.convert(o.boundingSphere).clone()
      } else {
        sphere.mergeSphere(BoundingSphere.convert(o.boundingSphere))
      }
    }

    for (const [g, group] of groups) {
      for (const [s, faces] of group) {
        const options = buildGroup(document, faces, s, mtlNames)
        for (const o of options) {
          mergeBox(o)
          mergeSphere(o)
          geometries.push(o)
        }
      }
    }

    result.materials = materials
    result.meshes = [
      {
        materials: materials,
        parts: geometries,
        boundingBox: box.toArray(),
        boundingSphere: sphere.toArray(),
      },
    ]
    result.nodes = [
      {
        mesh: 0,
      },
    ]
    result.scenes = [
      {
        nodes: [0],
      },
    ]
    result.scene = 0
    return result
  }

  public async loadMaterialLibs(libs: string[], context: LoaderContext): Promise<MaterialOptions[]> {
    const tasks: Promise<MaterialOptions[]>[] = []
    for (const lib of libs) {
      const url = context.content.resolveUrl(lib, context)
      tasks.push(
        context.content
          .loadAsset(url, {
            baseUrl: context.assetUrl,
            signal: context.signal,
            type: '.mtl',
          })
          .then((asset) => {
            return asset.materials || []
          }),
      )
    }
    return Promise.all(tasks).then((results) => results.flat())
  }
}

function readVertex<T>(data: Document, element: VertexTextureNormalRef, target: T) {
  const result = target as T & {
    position?: number[]
    color?: number[]
    texture?: number[]
    normal?: number[]
  }
  if (data.v != null && data.v[element.v] != null) {
    const value = data.v[element.v]
    if (value.length >= 3) {
      result.position = [value[0], value[1], value[2]]
    }
    if (value.length === 6) {
      result.color = [value[3], value[4], value[5]]
    }
  }
  if (element.vt != null && data.vt != null) {
    const value = data.vt[element.vt]
    if (value.length >= 2) {
      result.texture = [value[0], 1.0 - value[1]]
    } else {
      result.texture = [value[0], 0]
    }
  }
  if (element.vn != null && data.vn != null) {
    result.normal = data.vn[element.vn]
  }
  return result
}

function buildGroup(data: Document, faces: FaceElement[], smoothingGroup: number, mtlNames: string[]) {
  const builder = GeometryBuilder.begin({
    layout: [
      VertexLayout.create(['position', 'texture']),
      VertexLayout.create(['normal']),
      VertexLayout.create(['tangent', 'bitangent']),
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
      const vertex = readVertex(data, ref, {
        material: [mtl],
      })
      builder.addVertex(vertex)
      if (ref.vn == null) {
        hasNormals = false
      }
    }
    builder.addIndex(vertices.get(key))
  }

  faces[0].data[0].v
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

function splitByMaterial(builder: GeometryBuilder, mtlNames: string[]): GeometryOptions[] {
  const result: GeometryOptions[] = []
  const split = new Map<
    number,
    {
      builder: GeometryBuilder
      indexMap: Map<number, number>
    }
  >()

  builder.indices.forEach((index) => {
    const vertex = builder.readVertex(index)
    const materialId: number = vertex.material[0]
    delete vertex.material

    if (!split.has(materialId)) {
      split.set(materialId, {
        builder: GeometryBuilder.begin({
          // prettier-ignore
          layout: [
            ['position', 'texture'],
            ['normal'],
            ['tangent', 'bitangent'],
          ],
        }),
        indexMap: new Map<number, number>(),
      })
    }

    const mesh = split.get(materialId)
    if (mesh.builder.indexCount % 3 === 0 && mesh.builder.vertexCount >= 65536 - 2) {
      mesh.indexMap.clear()
      result.push(
        mesh.builder.calculateBoundings().endGeometry({
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
        entry.builder.calculateBoundings().endGeometry({
          materialId: mtl,
        }),
      )
    }
  })

  return result
}
