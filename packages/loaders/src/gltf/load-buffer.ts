import type { ResourceNode } from '@gglib/content'
import { dataTypeFromWebGL, dataTypeToArrayType, TypedArray } from '@gglib/graphics'
import type { GltfAssetContainer } from './asset'
import { Accessor, AccessorComponentType, BufferView } from './format'

export function loadBuffer(asset: GltfAssetContainer, index: number): ResourceNode<ArrayBuffer> {
  const graph = asset.graph
  // Check if the node already exists in the graph
  const key = `buffer:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }

  // get raw buffer view data from gltf document
  const gltf = asset.document.buffers[index]
  if (!gltf) {
    throw new Error(`Buffer with index ${index} not found in document`)
  }

  const node = graph.node<ArrayBuffer>(key, null)

  // embedded buffer
  // per the GLB spec, only buffer 0 may omit `uri` and reference the single embedded BIN chunk
  if (!gltf.uri && index === 0 && asset.document.chunks?.[0]) {
    node.data = asset.document.chunks[0]
    return node
  }

  // external buffer
  node.buildAsync = async (ctx): Promise<ArrayBuffer> => {
    const url = ctx.content.resolveUrl(gltf.uri, asset.url, ctx.baseUrl)
    const response = await ctx.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    return response.body
  }

  return node
}

export interface BufferViewAccessor {
  buffer: ArrayBuffer
  view: BufferView
  accessor: Accessor
}

export function loadBufferViewAccessor(asset: GltfAssetContainer, index: number): ResourceNode<BufferViewAccessor> {
  const graph = asset.graph
  const key = `bva:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }

  const gltf = asset.document.accessors?.[index]

  if (!gltf) {
    throw new Error(`[glTF] accessor with index ${index} does not exist`)
  }

  if (gltf.bufferView >= 0) {
    const node = graph.node<BufferViewAccessor>(key, null)
    const view = asset.document.bufferViews[gltf.bufferView]
    const bufferKey = graph.dependency(node, asset.bufferNode(view.buffer))

    node.build = (_, n, get): BufferViewAccessor => {
      return {
        buffer: get(bufferKey),
        view: view,
        accessor: gltf,
      }
    }
    return node
  }

  if (gltf.sparse) {
    const node = graph.node<BufferViewAccessor>(key, null)
    const sparse = gltf.sparse
    const view = asset.document.bufferViews[sparse.indices.bufferView]
    const bufferKey = graph.dependency(node, asset.bufferNode(view.buffer))
    node.build = (_, n, get): BufferViewAccessor => {
      return {
        buffer: get(bufferKey),
        view: view,
        accessor: gltf,
      }
    }
    return node
  }

  throw new Error('[]glTF] buffer accessor has neither a view nor a sparse definition')
}
export function loadAccessor(asset: GltfAssetContainer, index: number): ResourceNode<GLTFAccessorBase> {
  const graph = asset.graph
  const key = `accessor:${index}`
  if (graph.has(key)) {
    return graph.get(key)!
  }

  const gltf = asset.document.accessors?.[index]

  if (!gltf) {
    throw new Error(`[glTF] accessor not found: ${index}`)
  }

  if (gltf.bufferView >= 0) {
    const node = graph.node<GLTFAccessorBase>(key, null)
    const view = asset.document.bufferViews[gltf.bufferView]
    const bufferKey = graph.dependency(node, asset.bufferNode(view.buffer))
    node.build = (_, n, get): GLTFBufferViewAccessor => {
      const buffer = get(bufferKey)
      return new GLTFBufferViewAccessor(gltf, buffer, view)
    }
    return node
  }

  if (gltf.sparse) {
    // const sparse = data.sparse
    // const view = asset.document.bufferViews[sparse.indices.bufferView]
    // const bufferKey = graph.bind(node, this.bufferNode(view.buffer))
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

export abstract class GLTFAccessorBase {
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
}

export class GLTFBufferViewAccessor extends GLTFAccessorBase {
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
}

function createTypedArray(spec: { buffer: ArrayBuffer; byteOffset?: number; count: number }, type: number): TypedArray {
  const ArrayType = dataTypeToArrayType(dataTypeFromWebGL(type))
  return new ArrayType(spec.buffer, spec.byteOffset || 0, spec.count)
}
