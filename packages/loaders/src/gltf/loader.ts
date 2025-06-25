import { AssetContainer, AssetLoader, ContentLoader, imageFromBlob, LoaderContext } from '@gglib/content'
import {
  BufferOptions,
  dataTypeFromWebGL,
  dataTypeToArrayType,
  dataTypeToSize,
  GeometryOptions,
  GeometryUtil,
  MaterialOptions,
  MeshOptions,
  primitiveTypeFromWebGL,
  primitiveTypeToWebGL,
  SamplerState,
  textureFilterFromWebGL,
  TextureImageOptions,
  TextureOptions,
  textureWrapModeFromWebGL,
  TypedArray,
  VertexBuffer,
  VertexBufferOptions,
  VertexLayout,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere, Mat3, Mat4 } from '@gglib/math'
import { AnimationData, AnimationDataChannels, SkinData } from '@gglib/model'
import { append, Uri } from '@gglib/utils'
import {
  Accessor,
  AccessorComponentType,
  AccessorType,
  BufferView,
  Document,
  Material,
  Mesh,
  MeshPrimitive,
  parseBinary,
  TextureInfo,
} from './format'
import { getKhrExtension } from './format/KHR-Extensions'
import { getNwExtension } from './format/NW-Extensions'

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
  public context: LoaderContext

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    this.url = url
    this.content = context.content
    this.signal = context.signal
    this.document = await this.loadDocument(url, context)
    this.context = context

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

  public async loadDocument(url: string, context: LoaderContext) {
    if (Loader.isBinary(context.type || Uri.ext(url))) {
      const data = await context.content.fetch(url, {
        responseType: 'arraybuffer',
        signal: context.signal,
      })
      return await parseBinary(data.body)
    }
    const data = await context.content.fetch<Document>(url, {
      responseType: 'json',
      signal: context.signal,
    })
    return data.body
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
      const url = this.content.resolveUrl(buffer.uri, this.context)
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
        const url = this.content.resolveUrl(image.uri, this.context)
        return this.content
          .loadAsset(url, {
            baseUrl: this.context.baseUrl,
            signal: this.context.signal,
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

    let image: number
    const extKtx = getKhrExtension(texture, 'KHR_texture_basisu')
    const extDds = getKhrExtension(texture, 'MSFT_texture_dds')
    const extWebp = getKhrExtension(texture, 'EXT_texture_webp')
    if (extKtx) {
      image = extKtx.source
    } else if (extDds) {
      image = extDds.source
    } else if (extWebp) {
      image = extWebp.source
    } else {
      image = texture.source
    }

    if (image == null) {
      console.warn(`[glTF] texture has no image source: ${texture.name || index}`)
      return null
    }

    const imageOptions = await this.loadImage(image)
    return {
      ...imageOptions,
      generateMipmap: true,
      name: texture.name,
      meta: texture.extras,
      sampler: this.loadSampler(texture.sampler),
    }
  }

  public loadSampler(index: number): Partial<SamplerState> {
    const sampler = this.document.samplers?.[index]
    return {
      minFilter: textureFilterFromWebGL(sampler?.minFilter) ?? 'Linear',
      magFilter: textureFilterFromWebGL(sampler?.magFilter) ?? 'Linear',
      wrapU: textureWrapModeFromWebGL(sampler?.wrapS) ?? 'Repeat',
      wrapV: textureWrapModeFromWebGL(sampler?.wrapT) ?? 'Repeat',
    }
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
          params.EmissiveColorMap = texture
        }),
      )
      readTextureInfo(params, 'EmissiveColorMap', material.emissiveTexture)
    }
    if (material.emissiveFactor != null) {
      params.EmissiveColor = material.emissiveFactor
    }

    if (material.doubleSided) {
      params.DoubleSided = true
    }

    if (hints?.vertexColor) {
      params.VertexColor = true
    }

    let loadBaseMap: () => Promise<void>
    if (material.pbrMetallicRoughness) {
      result.technique = 'pbr'

      const pbr = material.pbrMetallicRoughness

      params.BaseColor = pbr.baseColorFactor ?? [1, 1, 1, 1]
      params.Metallic = pbr.metallicFactor ?? 1
      params.Roughness = pbr.roughnessFactor ?? 1
      if (pbr.baseColorTexture != null) {
        loadBaseMap = async () => {
          await this.loadTexture(pbr.baseColorTexture.index).then((texture) => {
            if (!params.BaseColorMap) {
              params.BaseColorMap = texture
            }
          })
          readTextureInfo(params, 'BaseColorMap', pbr.baseColorTexture)
        }
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

    const extPbrSpecGloss = getKhrExtension(material, 'KHR_materials_pbrSpecularGlossiness')
    if (extPbrSpecGloss) {
      result.technique = 'default'

      const ext = extPbrSpecGloss
      params.BaseColor = ext.diffuseFactor || params.BaseColor || [1, 1, 1, 1]
      params.SpecularColor = ext.specularFactor || params.SpecularColor || [1, 1, 1]
      params.Roughness = 1.0 - (ext.glossinessFactor ?? 1)

      if (ext.diffuseTexture) {
        loadBaseMap = async () => {
          await this.loadTexture(ext.diffuseTexture.index).then((texture) => {
            params.BaseColorMap = texture
          })
          readTextureInfo(params, 'BaseColorMap', ext.diffuseTexture)
        }
      } else {
        loadBaseMap = null
      }

      if (ext.specularGlossinessTexture) {
        tasks.push(
          this.loadTexture(ext.specularGlossinessTexture.index).then((texture) => {
            params.SpecularColorMap = texture
          }),
        )
        readTextureInfo(params, 'SpecularColorMap', ext.specularGlossinessTexture)

        tasks.push(
          this.loadTexture(ext.specularGlossinessTexture.index).then((texture) => {
            params.SmoothnessMapChannel = 'a'
            params.SmoothnessMap = texture
          }),
        )
        readTextureInfo(params, 'SmoothnessMap', ext.specularGlossinessTexture)
      }
      params.IndexOfRefraction = 0 // TODO: remove once assets use IOR extension
    }

    const extSpecular = getKhrExtension(material, 'KHR_materials_specular')
    if (extSpecular) {
      params.SpecularColor = extSpecular.specularColorFactor || params.SpecularColor || [1, 1, 1]
      if (extSpecular.specularColorTexture) {
        tasks.push(
          this.loadTexture(extSpecular.specularColorTexture.index).then((texture) => {
            params.SpecularColorMap = texture
          }),
        )
        readTextureInfo(params, 'SpecularColorMap', extSpecular.specularColorTexture)
      }

      params.Roughness = 1.0 - (extSpecular.specularFactor ?? 1.0)

      if (extSpecular.specularTexture) {
        tasks.push(
          this.loadTexture(extSpecular.specularTexture.index).then((texture) => {
            params.SmoothnessMapChannel = 'a'
            params.SmoothnessMap = texture
          }),
        )
        readTextureInfo(params, 'SmoothnessMap', extSpecular.specularTexture)
      }
    }

    const extIor = getKhrExtension(material, 'KHR_materials_ior')
    if (extIor) {
      params.IndexOfRefraction ??= extIor.ior ?? 1.5
    }

    const extNw = getNwExtension(material)
    if (extNw) {
      params.Metallic = 0
      if (extNw.smoothTexture) {
        tasks.push(
          this.loadTexture(extNw.smoothTexture.index).then((texture) => {
            params.SmoothnessMap = texture
          }),
        )
        params.SmoothnessMapChannel = 'r'
        readTextureInfo(params, 'SmoothnessMap', extNw.smoothTexture)
      }
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
    // if (material.extensions && material.extensions[KHR_materials_unlit]) {
    //   result.technique = 'unlit'
    // }

    if (loadBaseMap) {
      tasks.push(loadBaseMap())
    }

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
      dataType: dataTypeFromWebGL(acc.componentType),
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

        const dataType = dataTypeFromWebGL(accessor.componentType)
        const dataSize = dataTypeToSize(dataType)
        if (bufferOptions.dataType == null) {
          bufferOptions.dataType = dataType
        } else if (bufferOptions.dataType !== dataType) {
          console.warn(`interleaved buffer with different component types detected: ${dataType}`)
          if (dataSize > dataTypeToSize(bufferOptions.dataType)) {
            bufferOptions.dataType = dataType
          }
        }

        bufferOptions.layout[semantic] = {
          type: dataType,
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
        // console.debug('interlaved', bufferOptions.stride, layoutStride)
      }

      if (!bufferOptions.data) {
        const ArrayType = dataTypeToArrayType(bufferOptions.dataType)
        bufferOptions.data = new ArrayType(
          buffer,
          bufferView.byteOffset || 0,
          bufferView.byteLength / dataTypeToSize(bufferOptions.dataType),
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
      const primitiveType = primitiveTypeFromWebGL(part.mode) || 'TriangleList'
      const isTriangleList = primitiveType === 'TriangleList'
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
        const util = new GeometryUtil(iBufferOptions, vBufferOptions, primitiveType)
        if (!hasNormals) {
          util.calculateNormals({
            create: true,
            update: false,
          })
        }

        // if (!hasTangents || !hasBitangents) {
        //   util.calculateTangents({
        //     create: true,
        //     update: false,
        //   })
        // }
      }

      return {
        boundingBox: [...min, ...max],
        boundingSphere: BoundingSphere.createFromBox(BoundingBox.create(...min, ...max)).toArray(),
        materialId: part.material,
        primitiveType: primitiveType,
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
  public readonly data: TypedArray

  constructor(
    public readonly accessor: Accessor,
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

function createTypedArray(
  spec: { buffer: ArrayBuffer; byteOffset?: number; count: number },
  type: number,
): TypedArray {
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
      const matrix = translation.clone()
      matrix.multiply(scale)
      matrix.multiply(rotation)
      params[name + 'Transform'] = matrix
    }
  }
  if (info.texCoord > 0) {
    params[name + 'Coord'] = info.texCoord
  }
}

function fallbackMaterial(): Material {
  return {}
}
