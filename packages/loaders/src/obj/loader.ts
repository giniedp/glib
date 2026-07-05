import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, ResourceGraph, ResourceNode } from '@gglib/content'
import {
  createVertexLayout,
  GeometryBuilder,
  GeometryOptions,
  MaterialOptions,
  MeshOptions,
  TextureOptions,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { ModelOptions } from '@gglib/model'
import { addItemIfAbsent } from '@gglib/utils'
import { Document, FaceElement, parse, VertexTextureNormalRef } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.obj']
  public static mimeTypes = ['application/x-obj']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const data = parse(response.body)
    data.source = url
    return new Container(data)
  }
}

export class Container extends AssetContainer {
  public graph = new ResourceGraph()
  public document: Document

  public override readonly modelCount: number
  public override readonly materialCount: number
  public override readonly textureCount: number

  public constructor(document: Document) {
    super()
    this.document = document
    this.modelCount = 1
    this.materialCount = 0
    this.textureCount = 0
  }

  public override loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    throw new Error('Obj container does not contain materials')
  }

  public override loadTexture(index: number, context: LoaderContext): Promise<TextureOptions> {
    throw new Error('Obj container does not contain textures')
  }

  public override loadModel(index: number, context: LoaderContext) {
    const node = this.modelNode()
    return this.graph.load(node, context)
  }

  public materialsNode(lib: string): ResourceNode<MaterialOptions[]> {
    const key = `material/${lib}`
    if (this.graph.has(key)) {
      return this.graph.get(key)
    }

    const node = this.graph.node<MaterialOptions[]>(key, null)
    node.buildAsync = async (context) => {
      const url = context.content.resolveUrl(lib, this.document.source)
      const asset = await context.content.load(url)
      const materials: MaterialOptions[] = []
      for (let i = 0; i < asset.materialCount; i++) {
        materials[i] = await asset.loadMaterial(i, context)
      }
      return materials
    }
    return node
  }

  public modelNode() {
    const key = `model/${this.document.source}`
    if (this.graph.has(key)) {
      return this.graph.get(key)
    }

    const modelNode = this.graph.node<ModelOptions>(key, {
      meshes: [buildMesh(this.document)],
    })

    // obj models refer to materials by name, so we need to resolve all materials first

    const mtlLibs: string[] = []
    for (const face of this.document.f) {
      for (const mtl of face.state.mtllib || []) {
        addItemIfAbsent(mtlLibs, mtl)
      }
    }

    for (const lib of mtlLibs) {
      const materialsNode = this.materialsNode(lib)

      this.graph.assign(modelNode, materialsNode, (model, mtlLib) => {
        for (const mesh of model.meshes) {
          const meshMaterials: MaterialOptions[] = []
          mesh.materials = meshMaterials
          mesh.parts ||= []

          for (let geometryIndex = 0; geometryIndex < mesh.geometries.length; geometryIndex++) {
            const geometry = mesh.geometries[geometryIndex]
            const mtl = mtlLib.find((it) => it.name == geometry.meta['material'])
            if (!mtl) {
              console.warn(`Material '${geometry.meta['material']}' not found for geometry '${geometry.name}'`)
              continue
            }

            let materialIndex = meshMaterials.findIndex((it) => it.name === mtl.name)
            if (materialIndex < 0) {
              materialIndex++
              meshMaterials.push(mtl)
            }

            mesh.parts.push({
              geometryIndex,
              materialIndex,
            })
          }
        }
      })
    }

    return modelNode
  }
}

function buildMesh(document: Document): MeshOptions {
  const groups = new Map<string, Map<number, FaceElement[]>>()
  const usemtls: string[] = []
  // TODO: handle mtllibs correctly
  for (const face of document.f) {
    if (face.state.usemtl) {
      addItemIfAbsent(usemtls, face.state.usemtl)
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

  const geometries: GeometryOptions[] = []
  let box: BoundingBox
  function mergeBox(o: GeometryOptions) {
    if (!o.boundingBox) {
      return
    }
    if (!box) {
      box = BoundingBox.convert(o.boundingBox).copy()
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
      sphere = BoundingSphere.convert(o.boundingSphere).copy()
    } else {
      sphere.mergeSphere(BoundingSphere.convert(o.boundingSphere))
    }
  }

  for (const [g, group] of groups) {
    for (const [s, faces] of group) {
      for (const geometry of buildGeometries(document, faces, s, usemtls)) {
        mergeBox(geometry)
        mergeSphere(geometry)
        geometries.push(geometry)
      }
    }
  }

  return {
    materials: [],
    geometries: geometries,
    boundingBox: box.toArray(),
    boundingSphere: sphere.toArray(),
  }
}

function buildGeometries(
  data: Document,
  faces: FaceElement[],
  smoothingGroup: number,
  usemtls: string[],
): GeometryOptions[] {
  const builder = new GeometryBuilder({
    layout: [
      createVertexLayout(['position', 'texture']),
      createVertexLayout(['normal']),
      createVertexLayout(['tangent', 'bitangent']),
      // we abuse an attribute channel as metadata for a material id
      // so we can later split by material
      {
        material: {
          elementCount: 1, // - we dont care about this
          byteOffset: 0, // - and this
          normalized: false, // - and this
          elementType: 'float32', // - and this since we dont operate on this buffer
          packed: false,
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
      const mtlIndex = usemtls.indexOf(f.state.usemtl)
      addVertex(f.data[0], mtlIndex)
      addVertex(f.data[count], mtlIndex)
      addVertex(f.data[count + 1], mtlIndex)
    }
  }

  if (!hasNormals) {
    builder.calculateNormals()
  }
  builder.calculateTangents()

  return splitByMaterial(builder, usemtls)
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

function splitByMaterial(builder: GeometryBuilder, mtlNames: string[]): GeometryOptions[] {
  const result: GeometryOptions[] = []
  const buildersByMaterial = new Map<
    number,
    {
      builder: GeometryBuilder
      indexMap: Map<number, number>
    }
  >()

  builder.indices.forEach((index) => {
    const vertex = builder.readVertex(index)
    const mtlIndex: number = vertex.material[0]
    delete vertex.material

    if (!buildersByMaterial.has(mtlIndex)) {
      buildersByMaterial.set(mtlIndex, {
        builder: new GeometryBuilder({
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

    const mesh = buildersByMaterial.get(mtlIndex)
    if (mesh.builder.indexCount % 3 === 0 && mesh.builder.vertexCount >= 65536 - 2) {
      mesh.indexMap.clear()
      result.push(
        mesh.builder.calculateBounds().toGeometryOptions({
          name: `part_${result.length}_${mtlNames[mtlIndex] || 'default'}`,
          meta: {
            material: mtlNames[mtlIndex],
          },
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

  buildersByMaterial.forEach((entry, mtlIndex) => {
    if (!entry.builder.vertexCount) {
      return
    }

    result.push(
      entry.builder.calculateBounds().toGeometryOptions({
        name: `part_${result.length}_${mtlNames[mtlIndex] || 'default'}`,
        meta: {
          material: mtlNames[mtlIndex],
        },
      }),
    )
  })

  return result
}
