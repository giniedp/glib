import { AssetContainer, imageFromBlob, LoaderContext, ResourceGraph, ResourceNode, ResourceRef } from '@gglib/content'
import {
  BufferOptions,
  CommonMaterialProps,
  countBytes,
  DataType,
  dataTypeFromWebGL,
  dataTypeToArrayType,
  dataTypeToSize,
  GeometryUtil,
  magFilterFromWebGL,
  MaterialOptions,
  MeshOptions,
  MeshPartImport,
  minFilterFromWebGL,
  mipFilterFromWebGL,
  primitiveTypeFromWebGL,
  SamplerState,
  TextureOptions,
  textureWrapModeFromWebGL,
  TypedArray,
  VertexBufferOptions,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere, Mat3, Mat4 } from '@gglib/math'
import { ModelOptions, SkinData } from '@gglib/model'
import {
  Accessor,
  AccessorComponentType,
  AccessorType,
  BufferView,
  Document,
  Material,
  MeshPrimitive,
  Texture,
  TextureInfo,
} from './format'
import { getKhrExtension } from './format/KHR-Extensions'
import { Property } from './format/common'

export type GltfExtension<T, N> = {
  name: string
  handler: (asset: GltfAssetContainer, node: ResourceNode<N>, data: T) => void
}

export type GltfMaterialExtension = GltfExtension<Material, MaterialOptions>
export type GltfTextureExtension = GltfExtension<Texture, TextureOptions>

export class GltfAssetContainer extends AssetContainer {
  public override modelCount: number
  public override materialCount: number
  public override textureCount: number
  public readonly url: string
  public readonly graph = new ResourceGraph()
  public readonly document: Document
  public readonly extensions: Record<string, GltfExtension<any, any>>

  public constructor(url: string, document: Document, extensions: Record<string, GltfExtension<any, any>> = {}) {
    super()
    this.url = url
    this.document = document
    this.modelCount = 1
    this.materialCount = document.materials?.length || 0
    this.textureCount = document.textures?.length || 0
    this.extensions = extensions
  }

  public override loadModel(index: number, context: LoaderContext): Promise<ModelOptions> {
    return this.graph.load(this.modelNode(), context)
  }

  public override loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    return this.graph.load(this.materialNode(index), context)
  }

  public override loadTexture(index: number, context: LoaderContext): Promise<TextureOptions> {
    return this.graph.load(this.textureNode(index), context)
  }

  public getSampler(index: number): SamplerState {
    const sampler = this.document.samplers?.[index]
    return SamplerState.get({
      minFilter: minFilterFromWebGL(sampler?.minFilter),
      mipFilter: mipFilterFromWebGL(sampler?.minFilter),
      magFilter: magFilterFromWebGL(sampler?.magFilter),
      wrapU: textureWrapModeFromWebGL(sampler?.wrapS),
      wrapV: textureWrapModeFromWebGL(sampler?.wrapT),
    })
  }

  public modelNode(): ResourceNode<ModelOptions> {
    const key = `model`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }
    const node = this.graph.node<ModelOptions>(key, {
      meshes: [],
      animations: [],
      skins: [],
      nodes: (this.document.nodes || []).map((it) => JSON.parse(JSON.stringify(it))),
      scene: this.document.scene,
      scenes: (this.document.scenes || []).map((it) => JSON.parse(JSON.stringify(it))),
    })

    this.graph.assign(node, this.meshNode(this.document.scene), (model, mesh) => {
      model.meshes.push(mesh)
    })
    return node
  }

  public applyExtensions<N, D extends Property>(node: ResourceNode<N>, gltf: D) {
    if (!gltf.extensions) {
      return
    }

    for (const extName in gltf.extensions) {
      const extension = this.extensions[extName]
      if (extension) {
        extension.handler(this, node, gltf)
        continue
      }
      if (this.document.extensionsRequired?.includes(extName)) {
        console.warn(`Required glTF extension ${extName} is not supported by the loader`)
      }
    }
  }

  // #region Material Node
  public materialNode(index: number): ResourceNode<MaterialOptions> {
    // Check if the material node already exists in the graph
    const key = `material:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key) as ResourceNode<MaterialOptions>
    }

    // get raw material data from gltf document
    const gltf = this.document.materials?.[index]
    if (!gltf) {
      throw new Error(`Material with index ${index} not found in document`)
    }

    const node = this.graph.node<MaterialOptions>(key, {
      properties: {},
    })

    const params: CommonMaterialProps = node.data.properties

    if (gltf.alphaMode) {
      // TODO
    }

    if (gltf.alphaCutoff != null) {
      params.AlphaClip = gltf.alphaCutoff
    }

    if (gltf.doubleSided) {
      // TODO
    }

    if (gltf.emissiveFactor) {
      params.EmissiveColor = gltf.emissiveFactor
    }

    if (gltf.emissiveTexture) {
      this.graph.assign(node, this.textureNode(gltf.emissiveTexture.index), (material, texture) => {
        material.properties['emissiveTexture'] = texture
      })
    }

    if (gltf.occlusionTexture) {
      this.graph.assign(node, this.textureNode(gltf.occlusionTexture.index), (material, texture) => {
        material.properties['occlusionTexture'] = texture
      })
    }

    if (gltf.normalTexture) {
      this.graph.assign(node, this.textureNode(gltf.normalTexture.index), (material, texture) => {
        material.properties['normalTexture'] = texture
      })
    }

    if (gltf.pbrMetallicRoughness) {
      const pbr = gltf.pbrMetallicRoughness
      params.BaseColor = pbr.baseColorFactor || params.BaseColor || [1, 1, 1, 1]
      params.Metallic = pbr.metallicFactor ?? 1
      params.Roughness = pbr.roughnessFactor ?? 1

      if (pbr.baseColorTexture) {
        this.graph.assign(node, this.textureNode(pbr.baseColorTexture.index), (material, texture) => {
          material.properties['BaseColorMap'] = texture
          // readTextureInfo(params, 'BaseColorMap', pbr.baseColorTexture)
        })
      }

      if (pbr.metallicRoughnessTexture) {
        this.graph.assign(node, this.textureNode(pbr.metallicRoughnessTexture.index), (material, texture) => {
          material.properties['MetallicRoughnessMap'] = texture
        })
      }
    }

    this.applyExtensions(node, gltf)

    return node
  }
  // #endregion

  // #region Texture Node
  public textureNode(index: number): ResourceNode<TextureOptions> {
    // Check if the node already exists in the graph
    const key = `texture:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }

    // get raw texture data from gltf document
    const gltf = this.document.textures[index]
    if (!gltf) {
      throw new Error(`Texture with index ${index} not found in document`)
    }

    const node = this.graph.node<TextureOptions>(key, {})
    const imageRef = this.graph.dependency(node, this.imageNode(gltf.source))
    node.buildAsync = async (ctx, n, get) => {
      const image = get(imageRef)
      return {
        ...image,
      }
    }

    this.applyExtensions(node, gltf)

    return node
  }
  // #endregion

  // #region Image Node
  public imageNode(index: number): ResourceNode<TextureOptions> {
    // Check if the node already exists in the graph
    const key = `image:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }

    // get raw image data from gltf document
    const gltf = this.document.images[index]
    if (!gltf) {
      throw new Error(`Image with index ${index} not found in document`)
    }

    if (gltf.uri) {
      const node = this.graph.node<TextureOptions>(key, { name: gltf.name })
      node.buildAsync = async (ctx) => {
        const url = ctx.content.resolveUrl(gltf.uri, this.url, ctx.baseUrl)
        const container = await ctx.content.load(url, ctx)
        return container.loadTexture(0, ctx)
      }
      return node
    }

    if (typeof gltf.bufferView === 'number') {
      const node = this.graph.node<TextureOptions>(key, { name: gltf.name })
      const view = this.document.bufferViews[gltf.bufferView]
      const bufferKey = this.graph.dependency(node, this.bufferNode(view.buffer))
      node.buildAsync = (_, n, get): Promise<TextureOptions> => {
        const buffer = get(bufferKey)
        const array = new Uint8Array(buffer, view.byteOffset, view.byteLength)
        const blob = new Blob([array], { type: gltf.mimeType })
        console.log('blob', blob)
        return imageFromBlob(blob)
      }
      return node
    }

    throw new Error(`Image with index ${index} has neither uri nor bufferView`)
  }
  // #endregion

  // #region Buffer & Accessor Nodes
  public bufferNode(index: number): ResourceNode<ArrayBuffer> {
    // Check if the node already exists in the graph
    const key = `buffer:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }

    // get raw buffer view data from gltf document
    const gltf = this.document.buffers[index]
    if (!gltf) {
      throw new Error(`Buffer with index ${index} not found in document`)
    }

    const node = this.graph.node<ArrayBuffer>(key, null)

    // embedded buffer
    if (!gltf.uri && this.document.chunks?.[index]) {
      node.data = this.document.chunks[index]
      return node
    }

    // external buffer
    node.buildAsync = async (ctx): Promise<ArrayBuffer> => {
      const url = ctx.content.resolveUrl(gltf.uri, this.url, ctx.baseUrl)
      const response = await ctx.content.fetch(url, {
        responseType: 'arraybuffer',
      })
      return response.body
    }

    return node
  }

  public accessorNode(index: number): ResourceNode<GLTFAccessorBase> {
    const key = `accessor:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }

    const gltf = this.document.accessors?.[index]

    if (!gltf) {
      throw new Error(`[glTF] accessor not found: ${index}`)
    }

    if (gltf.bufferView >= 0) {
      const node = this.graph.node<GLTFAccessorBase>(key, null)
      const view = this.document.bufferViews[gltf.bufferView]
      const bufferKey = this.graph.dependency(node, this.bufferNode(view.buffer))
      node.build = (_, n, get): GLTFBufferViewAccessor => {
        const buffer = get(bufferKey)
        return new GLTFBufferViewAccessor(gltf, buffer, view)
      }
      return node
    }

    if (gltf.sparse) {
      // const sparse = data.sparse
      // const view = this.document.bufferViews[sparse.indices.bufferView]
      // const bufferKey = this.graph.bind(node, this.bufferNode(view.buffer))
      // node.resolve = async (_, n, get) => {
      // const iData = createTypedArray({
      //   buffer: iView.buffer,
      //   byteOffset: iView.byteOffset || 0,
      // }, sparse.indices.componentType as number)
      // const vView = await this.loadBufferView(sparse.values.bufferView)
      // const vData = createTypedArray(vView, accessor.componentType as number)
      // return new SparseAccessor(accessor, iData, vView, vData)
      // }
    }

    throw new Error('[]glTF] buffer accessor has neither a view nor a sparse definition')
  }
  // #endregion

  // #region Skin
  public skinNode(index: number): ResourceNode<SkinData> {
    const key = `skin:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }

    const gltf = this.document.skins?.[index]
    if (!gltf) {
      throw new Error(`[glTF] skin not found: ${index}`)
    }

    const node = this.graph.node<SkinData>(key, {
      name: gltf.name || null,
      joints: [...gltf.joints],
      skeleton: gltf.skeleton || null,
      inverseBindMatrices: [],
    })

    if (!gltf.inverseBindMatrices) {
      for (let i = 0; i < node.data.joints.length; i++) {
        node.data.inverseBindMatrices[i] = Mat4.createIdentity()
      }
      return node
    }

    const accessorKey = this.graph.dependency(node, this.accessorNode(gltf.inverseBindMatrices))
    node.build = (_, node, get) => {
      const joints = node.data.joints
      const accessor = get(accessorKey)
      const data = accessor.getDataWithoutOffset().slice() as Float32Array
      for (let i = 0; i < joints.length; i++) {
        node.data.inverseBindMatrices[i] = new Mat4(data.subarray(i * 16, (i + 1) * 16))
      }
      return node.data
    }

    return node
  }
  // #endregion

  // #region Mesh
  public meshNode(index: number): ResourceNode<MeshOptions> {
    const key = `mesh:${index}`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }

    const gltf = this.document.meshes?.[index]
    if (!gltf) {
      throw new Error(`[glTF] mesh not found: ${index} (${this.url})`)
    }

    const node = this.graph.node<MeshOptions>(key, {
      meta: {},
      geometries: [],
      materials: [],
      parts: [],
    })

    const partMtlRefs = gltf.primitives.map((part) => {
      return this.graph.dependency(node, this.materialNode(part.material))
    })

    const partRefs = gltf.primitives.map((part, partIndex): ResourceRef<MeshPartImport> => {
      // index buffer

      let iAccKey: ResourceRef<GLTFAccessorBase> = null
      if (part.indices != null) {
        iAccKey = this.graph.dependency(node, this.accessorNode(part.indices))
      }

      // vertex buffers

      const partKey = `${key}:part:${partIndex}`
      const partNode = this.graph.node<MeshPartImport>(partKey, null)
      const partRef = this.graph.dependency(node, partNode)

      const vAccKeys: Record<string, ResourceRef<GLTFAccessorBase>> = {}
      for (const [semantic, index] of Object.entries(part.attributes)) {
        vAccKeys[semantic] = this.graph.dependency(partNode, this.accessorNode(index))
      }

      partNode.build = (_, n, get) => {
        const accessors: Record<string, GLTFAccessorBase> = {}
        if (iAccKey) {
          accessors['indices'] = get(iAccKey)
        }
        for (const semantic in vAccKeys) {
          accessors[semantic] = get(vAccKeys[semantic])
        }

        return createMeshPart(this.document, part, accessors)
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
  // #endregion
}

abstract class GLTFAccessorBase {
  /**
   * The gltf accessor definition
   */
  public readonly accessor: Accessor

  /**
   * Specifies if the attribute is a scalar, vector, or matrix.
   */
  public get attributeType() {
    return this.accessor.type
  }

  /**
   * The number of attributes referenced by this accessor.
   *
   * @remarks
   * The number of attributes referenced by this accessor, not to be confused with the number of bytes or number of components.
   */
  public get attributeCount() {
    return this.accessor.count
  }

  /**
   * The number Number of components in one attribute
   */
  public get componentCount() {
    switch (this.attributeType) {
      case 'SCALAR':
        return 1
      case 'VEC2':
        return 2
      case 'VEC3':
        return 3
      case 'VEC4':
        return 4
      case 'MAT2':
        return 4
      case 'MAT3':
        return 9
      case 'MAT4':
        return 16
    }
    throw new Error(`unknown attribute type: ${this.attributeType}`)
  }

  /**
   * Specifies if the component is a byte, float, short etc.
   */
  public get componentType() {
    return this.accessor.componentType
  }

  /**
   * The size in bytes of a single component
   */
  public get componentSize(): number {
    switch (this.accessor.componentType) {
      case AccessorComponentType.BYTE:
        return 1
      case AccessorComponentType.FLOAT:
        return 4
      case AccessorComponentType.SHORT:
        return 2
      case AccessorComponentType.UNSIGNED_BYTE:
        return 1
      case AccessorComponentType.UNSIGNED_INT:
        return 4
      case AccessorComponentType.UNSIGNED_SHORT:
        return 2
    }
    throw new Error(`unknown component type: ${this.accessor.componentType}`)
  }

  public readonly byteOffset: number
  public readonly byteStride: number

  public abstract readonly data: TypedArray

  constructor(accessor: Accessor) {
    this.accessor = accessor
    this.byteOffset = accessor.byteOffset || 0
    this.byteStride = this.componentSize * this.componentCount
  }

  public getDataWithoutOffset() {
    if (this.byteOffset) {
      const componentCount = this.byteStride / this.componentSize
      const result = createTypedArray(
        {
          buffer: this.data.buffer,
          byteOffset: this.data.byteOffset + this.byteOffset,
          count: this.attributeCount * componentCount,
        },
        this.componentType,
      )
      return result
    }
    return this.data
  }

  public abstract readComponent(aIndex: number, cIndex: number): number
  // public abstract readAttribute(index: number, target: number[]): number[]

  public readV3(aIndex: number) {
    return {
      x: this.readComponent(aIndex, 0),
      y: this.readComponent(aIndex, 1),
      z: this.readComponent(aIndex, 2),
    }
  }

  public readV4(aIndex: number) {
    return {
      x: this.readComponent(aIndex, 0),
      y: this.readComponent(aIndex, 1),
      z: this.readComponent(aIndex, 2),
      w: this.readComponent(aIndex, 3),
    }
  }
}

class GLTFBufferViewAccessor extends GLTFAccessorBase {
  public readonly data: TypedArray
  private stride: number
  private offset: number

  constructor(accessor: Accessor, buffer: ArrayBuffer, view: Omit<BufferView, 'buffer'>) {
    super(accessor)
    this.offset = this.byteOffset / this.componentSize
    if (view.byteStride) {
      this.stride = view.byteStride / this.componentSize
    } else {
      this.stride = this.componentCount
    }
    this.data = createTypedArray(
      {
        buffer: buffer,
        byteOffset: view.byteOffset,
        count: this.offset + this.attributeCount * this.stride,
      },
      this.componentType,
    )
  }

  public readComponent(aIndex: number, cIndex: number): number {
    return this.data[this.offset + aIndex * this.stride + cIndex]
  }
}

class GLTFSparseAccessor extends GLTFAccessorBase {
  public readonly data: TypedArray

  constructor(
    accessor: Accessor,
    public readonly indices: TypedArray,
    public readonly valuesView: Omit<BufferView, 'buffer'>,
    public readonly valuesArray: TypedArray,
  ) {
    super(accessor)
    const ArrayType = dataTypeToArrayType(dataTypeFromWebGL(this.componentType))
    this.data = new ArrayType(this.componentSize * this.componentCount * this.attributeCount)
    for (let i = 0; i < this.indices.length; i++) {
      const index = this.indices[i]
      const value = valuesArray[i] // TODO: buteOffset etc.
      this.writeComponent(index, 0, value)
    }
  }

  public readComponent(aIndex: number, cIndex: number): number {
    return this.data[aIndex * this.componentCount + cIndex]
  }

  private writeComponent(aIndex: number, cIndex: number, value: number) {
    this.data[aIndex * this.componentCount + cIndex] = value
  }
}

function createTypedArray(spec: { buffer: ArrayBuffer; byteOffset?: number; count: number }, type: number): TypedArray {
  const ArrayType = dataTypeToArrayType(dataTypeFromWebGL(type))
  return new ArrayType(spec.buffer, spec.byteOffset || 0, spec.count)
}

const accesorTypeToElementCount: Record<AccessorType, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
}
function elementCount(type: AccessorType) {
  return accesorTypeToElementCount[type]
}

function readTextureInfo(params: { [k: string]: unknown }, name: string, info: TextureInfo) {
  const transform = getKhrExtension(info, 'KHR_texture_transform')
  if (transform) {
    const rotation = Mat3.createIdentity()
    const scale = Mat3.createIdentity()
    const translation = Mat3.createIdentity()

    let hasTransform = false
    if (transform.scale) {
      hasTransform = true
      scale.elements[0] = transform.scale[0] ?? 1
      scale.elements[4] = transform.scale[1] ?? 1
    }
    if (transform.offset) {
      hasTransform = true
      translation.elements[6] = transform.offset[0] ?? 0
      translation.elements[7] = transform.offset[1] ?? 0
    }
    if (transform.rotation != null) {
      hasTransform = true
      const s = Math.sin(transform.rotation)
      const c = Math.cos(transform.rotation)
      rotation.elements[0] = c
      rotation.elements[1] = -s
      rotation.elements[3] = s
      rotation.elements[4] = c
    }

    if (hasTransform) {
      const matrix = translation.copy()
      matrix.multiply(scale)
      matrix.multiply(rotation)
      params[name + 'Transform'] = matrix
    }
  }
  if (info.texCoord > 0) {
    params[name + 'Coord'] = info.texCoord
  }
}

function createMeshPart(
  doc: Document,
  part: MeshPrimitive,
  accessors: Record<string, GLTFAccessorBase>,
): MeshPartImport {
  let min = [0, 0, 0]
  let max = [0, 0, 0]
  Object.keys(part.attributes).forEach((semantic) => {
    const accessor = doc.accessors[part.attributes[semantic]]
    if (semantic === 'POSITION') {
      min = [...accessor.min]
      max = [...accessor.max]
    }
  })

  const iBufferOptions = createIndexBuffer(accessors['indices'])
  const vBufferOptions = createVertexBuffer(part, doc, accessors)
  const primitiveType = primitiveTypeFromWebGL(part.mode) || 'TriangleList'
  const isTriangleList = primitiveType === 'TriangleList'
  let hasNormals = false
  let hasTangents = false
  let hasBitangents = false

  for (const vBuffer of vBufferOptions) {
    if (vBuffer.vertexLayout.normal) {
      hasNormals = true
    }
    if (vBuffer.vertexLayout.tangent) {
      hasTangents = true
    }
    if (vBuffer.vertexLayout.bitangent) {
      hasBitangents = true
    }
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

function createIndexBuffer(acc: GLTFAccessorBase): BufferOptions {
  if (acc == null) {
    return null
  }

  return {
    type: 'IndexBuffer',
    data: acc.getDataWithoutOffset(),
    stride: acc.byteStride,
    indexType: dataTypeFromWebGL(acc.componentType) === 'uint16' ? 'uint16' : 'uint32',
  }
}

function createVertexBuffer(
  part: MeshPrimitive,
  doc: Document,
  accessors: Record<string, GLTFAccessorBase>,
): VertexBufferOptions {
  const vbOptions: VertexBufferOptions = []
  const bufferViewGroups = new Map<number, string[]>()

  for (const attribute of Object.keys(part.attributes)) {
    const accessor = doc.accessors[part.attributes[attribute]]
    if (!bufferViewGroups.has(accessor.bufferView)) {
      bufferViewGroups.set(accessor.bufferView, [])
    }
    bufferViewGroups.get(accessor.bufferView).push(attribute)
  }

  for (const [bufferViewId, attributes] of Array.from(bufferViewGroups.entries())) {
    const bufferView = doc.bufferViews[bufferViewId]
    // const buffer = this.getBuffer(bufferView.buffer)
    const buffer = accessors[attributes[0]].data.buffer

    const bufferOptions: BufferOptions = {
      stride: bufferView.byteStride,
      vertexLayout: {},
    }

    const elementTypes: DataType[] = []
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

      const elementType = dataTypeFromWebGL(accessor.componentType)
      if (!elementTypes.includes(elementType)) {
        elementTypes.push(elementType)
      }
      bufferOptions.vertexLayout[semantic] = {
        elementCount: elementCount(accessor.type),
        normalized: accessor.normalized || false,
        byteOffset: accessor.byteOffset || 0,
        elementType: elementType,
      }
    }

    const layoutStride = countBytes(bufferOptions.vertexLayout)
    if (!bufferOptions.stride) {
      // tightly packed buffer
      bufferOptions.stride = layoutStride
    } else if (bufferOptions.stride !== layoutStride) {
      // TODO:
      // interleaved buffer, sparse packed
    }

    if (elementTypes.length === 1) {
      const dataType = elementTypes[0]
      const ArrayType = dataTypeToArrayType(dataType)
      bufferOptions.data = new ArrayType(
        buffer,
        bufferView.byteOffset || 0,
        bufferView.byteLength / dataTypeToSize(dataType),
      )
    } else {
      bufferOptions.data = new Uint8Array(buffer, bufferView.byteOffset || 0, bufferView.byteLength)
    }

    vbOptions.push(bufferOptions)
  }

  return vbOptions
}
