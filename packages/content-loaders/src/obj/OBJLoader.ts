import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { GeometryBuilder, GeometryOptions, MaterialOptions, VertexLayout } from '@gglib/graphics'
import { addToArraySet } from '@gglib/utils'
import { FaceElement, OBJ, VertexTextureNormalRef } from './format'

export class OBJLoader implements AssetLoader {
  public static extensions = ['.obj']
  public static mimeTypes = ['application/x-obj']
  public static register() {
    ContentLoader.registerLoader({
      extensions: OBJLoader.extensions,
      mimeTypes: OBJLoader.mimeTypes,
      loader: OBJLoader,
    })
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const data = OBJ.parse(response.body)
    return this.convert(data, context)
  }

  public async convert(document: OBJ, context: LoaderContext): Promise<AssetContainer> {
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
    groups.forEach((group, g) => {
      group.forEach((faces, s) => {
        geometries.push(...buildGroup(document, faces, s, mtlNames))
      })
    })

    result.materials = materials
    result.meshes = [
      {
        parts: geometries,
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
      const url = context.content.resolveUrl(lib, context.assetUrl)
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
