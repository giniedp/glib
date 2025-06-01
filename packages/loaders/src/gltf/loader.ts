import { AssetContainer, AssetLoader, ContentLoader, imageFromBlob, LoaderContext } from '@gglib/content'
import {
  BufferOptions,
  DataType,
  dataTypeSize,
  GeometryOptions,
  GeometryUtil,
  MaterialOptions,
  MeshOptions,
  nameOfDataType,
  PrimitiveType,
  TextureImageOptions,
  TextureOptions,
  VertexBuffer,
  VertexBufferOptions,
  VertexLayout,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { AnimationData, AnimationDataChannels, SkinData } from '@gglib/model'
import { append, Uri } from '@gglib/utils'
import {
  Accessor,
  AccessorComponentType,
  AccessorType,
  BufferView,
  Document,
  KHR_materials_pbrSpecularGlossiness,
  KHR_texture_transform,
  Material,
  Mesh,
  MeshPrimitive,
  parseBinary,
  PbrMaterialSpecularGlossiness,
  TextureInfo,
  TextureTransform,
} from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions = ['.gltf', '.glb']
  public static mimeTypes = ['model/gltf+json', 'model/gltf-binary']
  public static loader = Loader

  public static registerExtension() {
    // TODO:
  }

  public static isBinary(type: string) {
    return type === 'model/gltf-binary' || type === 'application/octet-stream' || type === '.glb'
  }

  private cache = new Map<string, Promise<any>>()

  public url: string
  public document: Document
  public content: ContentLoader
  public signal: AbortSignal

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    this.url = url
    this.content = context.content
    this.signal = context.signal
    if (Loader.isBinary(context.type || Uri.ext(url))) {
      const data = await context.content.fetch(url, {
        responseType: 'arraybuffer',
        signal: context.signal,
      })
      this.document = await parseBinary(data.body)
    } else {
      const data = await context.content.fetch<Document>(url, {
        responseType: 'json',
        signal: context.signal,
      })
      this.document = data.body
    }

    console.debug('gltf document', this.document)
    const result: AssetContainer = {
      source: url,
      meshes: [],
      animations: [],
      skins: [],
      nodes: this.document.nodes.map((it) => JSON.parse(JSON.stringify(it))),
      scene: this.document.scene,
      scenes: this.document.scenes.map((it) => JSON.parse(JSON.stringify(it))),
    }

    const tasks: Promise<void>[] = []
    if (this.document.meshes) {
      tasks.push(
        ...this.document.meshes.map(async (_, index) => {
          result.meshes[index] = await this.loadMesh(index)
        }),
      )
    }

    if (this.document.animations) {
      tasks.push(
        ...this.document.animations.map(async (_, index) => {
          result.animations[index] = await this.loadAnimation(index)
        }),
      )
    }

    if (this.document.skins) {
      tasks.push(
        ...this.document.skins.map(async (_, index) => {
          result.skins[index] = await this.loadSkin(index)
        }),
      )
    }

    await Promise.all(tasks)
    return result
  }

  public async loadAccessor(index: number): Promise<GLTFAccessorBase> {
    if (!this.document.accessors?.[index]) {
      throw new Error(`[glTF] accessor not found: ${index}`)
    }
    const accessor = this.document.accessors[index]

    if (accessor.bufferView >= 0) {
      const view = await this.loadBufferView(accessor.bufferView)
      return new GLTFBufferViewAccessor(accessor, view.buffer, view)
    }

    if (accessor.sparse) {
      const sparse = accessor.sparse
      const iView = await this.loadBufferView(sparse.indices.bufferView)

      // const iData = createTypedArray({
      //   buffer: iView.buffer,
      //   byteOffset: iView.byteOffset || 0,

      // }, sparse.indices.componentType as number)
      // const vView = await this.loadBufferView(sparse.values.bufferView)
      // const vData = createTypedArray(vView, accessor.componentType as number)
      // return new SparseAccessor(accessor, iData, vView, vData)
    }

    throw new Error('[]glTF] buffer accessor has neither a view nor a sparse definition')
  }

  public async loadBufferView(index: number) {
    if (!this.document.bufferViews?.[index]) {
      throw new Error(`[glTF] bufferView not found: ${index}`)
    }
    const bufferView = this.document.bufferViews[index]
    const buffer = await this.loadBuffer(bufferView.buffer)
    return {
      ...bufferView,
      buffer: buffer,
    }
  }

  public async loadBuffer(index: number): Promise<ArrayBuffer> {
    return this.cached(`buffer-${index}`, async (): Promise<ArrayBuffer> => {
      const buffer = this.document.buffers?.[index]
      if (!buffer) {
        throw new Error(`[glTF] buffer not found: ${index}`)
      }
      if (!buffer.uri && this.document.chunks?.[index]) {
        return Promise.resolve(this.document.chunks[index])
      }
      const url = this.content.resolveUrl(buffer.uri, this.url)
      const response = await this.content.fetch(url, {
        responseType: 'arraybuffer',
      })
      return response.body
    })
  }

  public async loadImage(index: number): Promise<TextureImageOptions> {
    return this.cached(`image-${index}`, async () => {
      if (!this.document.images?.[index]) {
        throw new Error(`[glTF] image not found: ${index}`)
      }
      const image = this.document.images[index]

      if (image.uri) {
        const url = this.content.resolveUrl(image.uri, this.url)
        return this.content
          .loadAsset(url, {
            signal: this.signal,
          })
          .then((asset) => asset.textures[0])
      }
      if (typeof image.bufferView === 'number') {
        const view = await this.loadBufferView(image.bufferView)
        const array = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
        const blob = new Blob([array], { type: image.mimeType })
        return await imageFromBlob(blob)
      }
      throw new Error(`[glTF] image has no uri or bufferView: ${index}`)
    })
  }

  public async loadTexture(index: number): Promise<TextureOptions> {
    const texture = this.document.textures[index]
    if (!texture) {
      throw new Error(`[glTF] texture not found: ${index}`)
    }
    const sampler = this.document.samplers?.[texture.sampler]
    const imageOptions = await this.loadImage(texture.source)
    const options: TextureOptions = {
      ...imageOptions,
      name: texture.name,
      meta: texture.extras,
    }
    if (sampler) {
      options.sampler = {
        minFilter: sampler.minFilter,
        magFilter: sampler.magFilter,
        wrapU: sampler.wrapS,
        wrapV: sampler.wrapT,
      }
    }

    return options
  }

  public async loadAnimation(index: number): Promise<AnimationData> {
    const srcAnimation = this.document.animations?.[index]
    const animation: AnimationData = {
      name: srcAnimation.name || null,
      type: 'channels',
      duration: null,
      channels: null,
    }

    const channels = new Map<number, AnimationDataChannels>()

    for (const srcChannel of srcAnimation.channels) {
      const target = srcChannel.target.node
      if (!channels.has(target)) {
        channels.set(target, { target: target })
      }
      const channel = channels.get(target)
      const path = srcChannel.target.path
      if (path in channel) {
        console.warn('channel samples ignored. It targets same path of same node as one of the previous channels.')
        continue
      }

      const srcSampler = srcAnimation.samplers[srcChannel.sampler]
      const accIn = await this.loadAccessor(srcSampler.input)
      const accOut = await this.loadAccessor(srcSampler.output)

      const interpolation = (srcSampler.interpolation?.toLocaleLowerCase() as any) || 'linear'
      const isCubic = interpolation === 'cubicspline'

      channel[path] = {
        interpolation: interpolation,
        samples: [],
      }

      for (let i = 0; i < accIn.attributeCount; i++) {
        const time = accIn.readComponent(i, 0)
        const i3 = i * 3
        switch (path) {
          case 'rotation':
            channel.rotation.samples = append(
              channel.rotation.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV4(i3 + 0),
                    value: accOut.readV4(i3 + 1),
                    to: accOut.readV4(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV4(i),
                  },
            )
            break
          case 'scale':
            channel.scale.samples = append(
              channel.scale.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV3(i3 + 0),
                    value: accOut.readV3(i3 + 1),
                    to: accOut.readV3(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV3(i),
                  },
            )
            break
          case 'translation':
            channel.translation.samples = append(
              channel.translation.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV3(i3 + 0),
                    value: accOut.readV3(i3 + 1),
                    to: accOut.readV3(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV3(i),
                  },
            )
            break
          case 'weights':
            // TODO:
            break
        }
      }
    }

    animation.channels = Array.from(channels.values())

    return animation
  }

  public async loadMaterial(index: number, hints?: { vertexColor?: boolean }): Promise<MaterialOptions> {
    const material = this.document.materials?.[index] || fallbackMaterial()
    const result: MaterialOptions = {
      name: material.name,
      meta: material.extras,
      parameters: {},
      effectName: 'BasicEffect',
      technique: 'default',
    }
    // console.debug(`[glTF] material`, material, this.document)

    const params = result.parameters
    const tasks: Array<Promise<void>> = []

    if (material.normalTexture != null) {
      tasks.push(
        this.loadTexture(material.normalTexture.index).then((texture) => {
          params.NormalMap = texture
        }),
      )
      readTextureInfo(params, 'NormalMap', material.normalTexture)
    }
    if (material.occlusionTexture != null) {
      tasks.push(
        this.loadTexture(material.occlusionTexture.index).then((texture) => {
          params.OcclusionMap = texture
        }),
      )
      readTextureInfo(params, 'OcclusionMap', material.occlusionTexture)
    }
    if (material.emissiveTexture != null) {
      tasks.push(
        this.loadTexture(material.emissiveTexture.index).then((texture) => {
          params.EmissionMap = texture
        }),
      )
      readTextureInfo(params, 'EmissionMap', material.emissiveTexture)
    }
    if (material.emissiveFactor != null) {
      params.EmissionColor = material.emissiveFactor
    }
    switch (material.alphaMode) {
      case 'BLEND':
        params.Blend = true
        params.Alpha = 1.0
        break
      case 'MASK':
        params.Blend = false
        if (typeof material.alphaCutoff === 'number') {
          params.AlphaClip = Math.max(0, material.alphaCutoff)
        } else {
          params.AlphaClip = 0.5
        }
        break
      case 'OPAQUE':
        params.Blend = false
        break
    }

    if (material.doubleSided) {
      params.DoubleSided = true
    }

    if (hints?.vertexColor) {
      params.VertexColor = true
    }

    if (material.extensions && material.extensions[KHR_materials_pbrSpecularGlossiness]) {
      result.technique = 'default'

      const ext: PbrMaterialSpecularGlossiness = material.extensions[KHR_materials_pbrSpecularGlossiness]
      params.DiffuseColor = ext.diffuseFactor ?? [1, 1, 1, 1]
      params.SpecularColor = ext.specularFactor ?? [1, 1, 1]
      params.Glossiness = ext.glossinessFactor ?? 1

      if (ext.diffuseTexture) {
        tasks.push(
          this.loadTexture(ext.diffuseTexture.index).then((texture) => {
            params.DiffuseMap = texture
          }),
        )
        readTextureInfo(params, 'DiffuseMap', ext.diffuseTexture)
      }
      if (ext.specularGlossinessTexture) {
        tasks.push(
          this.loadTexture(ext.specularGlossinessTexture.index).then((texture) => {
            params.SpecularMap = texture
          }),
        )
        readTextureInfo(params, 'SpecularMap', ext.specularGlossinessTexture)
      }
    } else if (material.pbrMetallicRoughness) {
      result.technique = 'pbr'

      const pbr = material.pbrMetallicRoughness

      params.DiffuseColor = pbr.baseColorFactor ?? [1, 1, 1, 1]
      params.Metallic = pbr.metallicFactor ?? 1
      params.Roughness = pbr.roughnessFactor ?? 1
      if (pbr.baseColorTexture != null) {
        tasks.push(
          this.loadTexture(pbr.baseColorTexture.index).then((texture) => {
            params.DiffuseMap = texture
          }),
        )
        readTextureInfo(params, 'DiffuseMap', pbr.baseColorTexture)
      }
      if (pbr.metallicRoughnessTexture != null) {
        tasks.push(
          this.loadTexture(pbr.metallicRoughnessTexture.index).then((texture) => {
            params.MetallicRoughnessMap = texture
          }),
        )
        readTextureInfo(params, 'MetallicRoughnessMap', pbr.metallicRoughnessTexture)
      }
    }

    // if (material.extensions && material.extensions[KHR_materials_unlit]) {
    //   result.technique = 'unlit'
    // }

    await Promise.all(tasks)
    return result
  }

  public async loadSkin(index: number): Promise<SkinData> {
    const skin = this.document.skins[index]
    if (!skin) {
      throw new Error(`[glTF] skin not found: ${index}`)
    }
    const result: SkinData = {
      name: skin.name || null,
      joints: [...skin.joints],
      skeleton: skin.skeleton || null,
      inverseBindMatrices: [],
    }

    if (!skin.inverseBindMatrices) {
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices[i] = Mat4.createIdentity()
      }
    } else {
      const accessor = await this.loadAccessor(skin.inverseBindMatrices)
      const data = accessor.getDataWithoutOffset().slice() as Float32Array
      for (let i = 0; i < result.joints.length; i++) {
        result.inverseBindMatrices[i] = new Mat4(data.subarray(i * 16, (i + 1) * 16))
      }
    }

    return result
  }

  public async loadIndexBuffer(part: MeshPrimitive): Promise<BufferOptions> {
    if (part.indices == null) {
      return null
    }
    const acc = await this.loadAccessor(part.indices)
    return {
      data: acc.getDataWithoutOffset(),
      stride: acc.byteStride,
      dataType: acc.componentType as number,
    }
  }

  public async loadVertexBuffers(part: MeshPrimitive): Promise<VertexBufferOptions> {
    const vbOptions: VertexBufferOptions = []
    const bufferViewGroups = new Map<number, string[]>()
    const doc = this.document

    for (const attribute of Object.keys(part.attributes)) {
      const accessor = doc.accessors[part.attributes[attribute]]
      if (!bufferViewGroups.has(accessor.bufferView)) {
        bufferViewGroups.set(accessor.bufferView, [])
      }
      bufferViewGroups.get(accessor.bufferView).push(attribute)
    }

    for (const [bufferViewId, attributes] of Array.from(bufferViewGroups.entries())) {
      const bufferView = doc.bufferViews[bufferViewId]
      const buffer = await this.loadBuffer(bufferView.buffer)

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
        console.debug('interlaved', bufferOptions.stride, layoutStride)
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

  public async loadMeshParts(mesh: Mesh): Promise<GeometryOptions[]> {
    let min = [0, 0, 0]
    let max = [0, 0, 0]
    const doc = this.document
    const result = mesh.primitives.map(async (part): Promise<GeometryOptions> => {
      Object.keys(part.attributes).forEach(async (semantic) => {
        const accessor = doc.accessors[part.attributes[semantic]]
        if (semantic === 'POSITION') {
          min = [...accessor.min]
          max = [...accessor.max]
        }
      })

      const iBufferOptions = await this.loadIndexBuffer(part)
      const vBufferOptions = await this.loadVertexBuffers(part)
      const isTriangleList = part.mode === PrimitiveType.TriangleList || !part.mode
      let hasNormals = false
      let hasTangents = false
      let hasBitangents = false
      for (const vBuffer of vBufferOptions) {
        if (vBuffer.layout.normal) {
          hasNormals = true
        }
        if (vBuffer.layout.tangent) {
          hasTangents = true
        }
        if (vBuffer.layout.bitangent) {
          hasBitangents = true
        }
      }

      if (isTriangleList && (!hasNormals || !hasTangents || !hasBitangents)) {
        const util = new GeometryUtil(iBufferOptions, vBufferOptions, part.mode || PrimitiveType.TriangleList)
        if (!hasNormals) {
          util.calculateNormals({
            create: true,
            update: false,
          })
        }

        if (!hasTangents || !hasBitangents) {
          util.calculateTangents({
            create: true,
            update: false,
          })
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
    })

    return Promise.all(result)
  }

  public async loadMesh(index: number): Promise<MeshOptions> {
    const mesh = this.document.meshes[index]
    if (!mesh) {
      throw new Error(`[glTF] mesh not found: ${index}`)
    }
    const parts = await this.loadMeshParts(mesh)

    const materials: MaterialOptions[] = []
    const mtlMap = new Map<number | string, number>()
    for (const part of parts) {
      if (!mtlMap.has(part.materialId)) {
        mtlMap.set(part.materialId, materials.length)
        materials.push(
          await this.loadMaterial(part.materialId as number, {
            vertexColor: hasVertexColor(part),
          }),
        )
      }
      part.materialId = mtlMap.get(part.materialId)
    }

    return {
      name: mesh.name,
      meta: { ...(mesh.extras || {}) },
      materials: materials,
      parts: parts,
      boundingBox: BoundingBox.mergeBoxes(...parts.map((it) => it.boundingBox)),
      boundingSphere: BoundingSphere.mergeSpheres(...parts.map((it) => it.boundingSphere)),
    }
  }

  protected cached<T>(key: string, loadFn: () => Promise<T>): Promise<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, loadFn())
    }
    return this.cache.get(key)
  }
}

function hasVertexColor(part: GeometryOptions): boolean {
  if (!part || !part.vertexBuffer) {
    return false
  }
  if (part.vertexBuffer instanceof VertexBuffer) {
    for (const buffer of part.vertexBuffer.buffers) {
      if (buffer.layout.color) {
        return true
      }
    }
  } else {
    for (const buffer of part.vertexBuffer) {
      if (buffer.layout.color) {
        return true
      }
    }
  }
  return false
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
  }

  public readonly byteOffset: number
  public readonly byteStride: number

  public abstract readonly data: AnyTypedArray

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
  public readonly data: AnyTypedArray
  private stride: number
  private offset: number

  constructor(public readonly accessor: Accessor, buffer: ArrayBuffer, view: Omit<BufferView, 'buffer'>) {
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
  public readonly data: AnyTypedArray

  constructor(
    public readonly accessor: Accessor,
    public readonly indices: AnyTypedArray,
    public readonly valuesView: Omit<BufferView, 'buffer'>,
    public readonly valuesArray: AnyTypedArray,
  ) {
    super(accessor)
    this.data = new ArrayType[this.componentType](this.componentSize * this.componentCount * this.attributeCount)
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

function createTypedArray(
  spec: { buffer: ArrayBuffer; byteOffset?: number; count: number },
  type: number,
): AnyTypedArray {
  const TYPE = ArrayType[type]
  const result = new TYPE(spec.buffer, spec.byteOffset || 0, spec.count)
  return result
}

const ArrayType = Object.freeze({
  0x1400: Int8Array,
  0x1402: Int16Array,
  0x1404: Int32Array,
  0x1401: Uint8Array,
  0x1403: Uint16Array,
  0x1405: Uint32Array,
  0x1406: Float32Array,
  0x8363: Uint16Array,
  0x8033: Uint16Array,
  0x8034: Uint16Array,
})

type AnyTypedArray =
  | Int8Array<ArrayBuffer>
  | Int16Array<ArrayBuffer>
  | Int32Array<ArrayBuffer>
  | Uint8Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Uint32Array<ArrayBuffer>
  | Float32Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>

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

function readTextureInfo(params: { [k: string]: unknown }, name: string, info: TextureInfo) {
  if (info.extensions && info.extensions[KHR_texture_transform]) {
    const transform = info.extensions[KHR_texture_transform] as TextureTransform
    const offsetScale = [1, 1, 0, 0]
    if (transform.scale) {
      offsetScale[0] = transform.scale[0]
      offsetScale[1] = transform.scale[1]
    }
    if (transform.offset) {
      offsetScale[2] = transform.offset[0] || 0
      offsetScale[3] = transform.offset[1] || 0
    }
    if (transform.offset || transform.scale) {
      params[name + 'ScaleOffset'] = offsetScale
    }
  }
  if (info.texCoord > 0) {
    params[name + 'Coord'] = info.texCoord
  }
}

function fallbackMaterial(): Material {
  return {}
}
