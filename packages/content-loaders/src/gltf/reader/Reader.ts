import {
  GLTFDocument,
  GLTFTexture,
  GLTFSampler,
  GLTFImage,
  GLTFBuffer,
  GLTFBufferView,
  GLTFAccessor,
  GLTFAccessorComponentType,
} from '../format'

export class GLTFReader {
  private cache = new Map<string, Promise<any>>()

  public constructor(public readonly doc: GLTFDocument, private loader: (buffer: GLTFBuffer) => Promise<ArrayBuffer>) {}

  async loadTexture<T>(
    index: number,
    loader: (texture: GLTFTexture, sampler: GLTFSampler, image: GLTFImage) => Promise<T>,
  ) {
    return this.cached(`texture-${index}`, async () => {
      if (!this.doc.textures?.[index]) {
        throw new Error(`[glTF] texture not found: ${index}`)
      }
      const texture = this.doc.textures[index]
      const sampler = this.doc.samplers?.[texture.sampler]
      const image = this.doc.images?.[texture.source]
      return loader(texture, sampler, image)
    })
  }

  public loadAccessor(index: number): Promise<GLTFAccessorBase> {
    return this.cached(
      `accessor-${index}`,
      async (): Promise<GLTFAccessorBase> => {
        if (!this.doc.accessors?.[index]) {
          throw new Error(`[glTF] accessor not found: ${index}`)
        }
        const accessor = this.doc.accessors[index]

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
      },
    )
  }

  public async loadBufferView(index: number) {
    return this.cached(`buffer-view-${index}`, async () => {
      if (!this.doc.bufferViews?.[index]) {
        throw new Error(`[glTF] bufferView not found: ${index}`)
      }
      const bufferView = this.doc.bufferViews[index]
      const buffer = await this.loadBuffer(bufferView.buffer)

      return {
        ...bufferView,
        buffer: buffer,
      }
    })
  }

  public loadBuffer(index: number): Promise<ArrayBuffer> {
    return this.cached(
      `buffer-${index}`,
      async (): Promise<ArrayBuffer> => {
        if (!this.doc.buffers?.[index]) {
          throw new Error(`[glTF] buffer not found: ${index}`)
        }
        return this.loader(this.doc.buffers[index])
      },
    )
  }

  private cached<T>(key: string, loadFn: () => Promise<T>): Promise<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, loadFn())
    }
    return this.cache.get(key)
  }
}

export abstract class GLTFAccessorBase {
  /**
   * The gltf accessor definition
   */
  public readonly accessor: GLTFAccessor

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
      case GLTFAccessorComponentType.BYTE:
        return 1
      case GLTFAccessorComponentType.FLOAT:
        return 4
      case GLTFAccessorComponentType.SHORT:
        return 2
      case GLTFAccessorComponentType.UNSIGNED_BYTE:
        return 1
      case GLTFAccessorComponentType.UNSIGNED_INT:
        return 4
      case GLTFAccessorComponentType.UNSIGNED_SHORT:
        return 2
    }
  }

  public readonly byteOffset: number
  public readonly byteStride: number

  public abstract readonly data: AnyTypedArray

  constructor(accessor: GLTFAccessor) {
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

export class GLTFBufferViewAccessor extends GLTFAccessorBase {
  public readonly data: AnyTypedArray
  private stride: number
  private offset: number

  constructor(public readonly accessor: GLTFAccessor, buffer: ArrayBuffer, view: Omit<GLTFBufferView, 'buffer'>) {
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

export class GLTFSparseAccessor extends GLTFAccessorBase {
  public readonly data: AnyTypedArray

  constructor(
    public readonly accessor: GLTFAccessor,
    public readonly indices: AnyTypedArray,
    public readonly valuesView: Omit<GLTFBufferView, 'buffer'>,
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

export const ArrayType = Object.freeze({
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
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Float32Array
  | Uint16Array
  | Uint16Array
  | Uint16Array
