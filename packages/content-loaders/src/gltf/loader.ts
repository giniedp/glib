// import { AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
// import { Accessor, AccessorComponentType, BufferView, GLTF, GLTFDocument } from './format'

// class GltfLoader implements AssetLoader {
//   public static register() {
//     ContentLoader.register({
//       extensions: ['.gltf', '.glb'],
//       mimeTypes: ['model/gltf+json', 'model/gltf-binary'],
//       loader: GltfLoader,
//     })
//   }

//   public static registerExtension() {
//     // TODO:
//   }

//   public static isBinary(type: string) {
//     return type === 'model/gltf-binary' || type === 'application/octet-stream' || type === '.glb'
//   }

//   private cache = new Map<string, Promise<any>>()

//   public url: string

//   public document: GLTFDocument

//   public content: ContentLoader

//   public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
//     this.url = url
//     this.content = context.content
//     if (GltfLoader.isBinary(context.type)) {
//       const data = await context.content.fetch(url, {
//         responseType: 'arraybuffer',
//         signal: context.signal,
//       })
//       this.document = await GLTF.parseBinary(data.body)
//     } else {
//       const data = await context.content.fetch<GLTFDocument>(url, {
//         responseType: 'json',
//         signal: context.signal,
//       })
//       this.document = data.body
//     }
//   }

//   public async loadAccessor(index: number): Promise<GLTFAccessorBase> {
//     if (!this.document.accessors?.[index]) {
//       throw new Error(`[glTF] accessor not found: ${index}`)
//     }
//     const accessor = this.document.accessors[index]

//     if (accessor.bufferView >= 0) {
//       const view = await this.loadBufferView(accessor.bufferView)
//       return new GLTFBufferViewAccessor(accessor, view.buffer, view)
//     }

//     if (accessor.sparse) {
//       const sparse = accessor.sparse
//       const iView = await this.loadBufferView(sparse.indices.bufferView)

//       // const iData = createTypedArray({
//       //   buffer: iView.buffer,
//       //   byteOffset: iView.byteOffset || 0,

//       // }, sparse.indices.componentType as number)
//       // const vView = await this.loadBufferView(sparse.values.bufferView)
//       // const vData = createTypedArray(vView, accessor.componentType as number)
//       // return new SparseAccessor(accessor, iData, vView, vData)
//     }

//     throw new Error('[]glTF] buffer accessor has neither a view nor a sparse definition')
//   }

//   public async loadBufferView(index: number) {
//     if (!this.document.bufferViews?.[index]) {
//       throw new Error(`[glTF] bufferView not found: ${index}`)
//     }
//     const bufferView = this.document.bufferViews[index]
//     const buffer = await this.loadBuffer(bufferView.buffer)
//     return {
//       ...bufferView,
//       buffer: buffer,
//     }
//   }

//   public async loadBuffer(index: number): Promise<ArrayBuffer> {
//     return this.cached(`buffer-${index}`, async (): Promise<ArrayBuffer> => {
//       if (!this.document.buffers?.[index]) {
//         throw new Error(`[glTF] buffer not found: ${index}`)
//       }
//       if (!this.document.buffers[index].uri && this.document.chunks?.[index]) {
//         return Promise.resolve(this.document.chunks[index])
//       }
//       const url = this.content.resolveUrl(this.url, this.document.buffers[index].uri)
//       const response = await this.content.fetch(url, {
//         responseType: 'arraybuffer',
//       })
//       return response.body
//     })
//   }

//   // public async loadTexture<T>(index: number, loader: (texture: Texture, sampler: Sampler, image: Image) => Promise<T>) {
//   //   return this.cached(`texture-${index}`, async () => {
//   //     if (!this.document.textures?.[index]) {
//   //       throw new Error(`[glTF] texture not found: ${index}`)
//   //     }
//   //     const texture = this.document.textures[index]
//   //     const sampler = this.document.samplers?.[texture.sampler]
//   //     const image = this.document.images?.[texture.source]

//   //     return loader(texture, sampler, image)
//   //   })
//   // }

//   protected cached<T>(key: string, loadFn: () => Promise<T>): Promise<T> {
//     if (!this.cache.has(key)) {
//       this.cache.set(key, loadFn())
//     }
//     return this.cache.get(key)
//   }
// }

// GltfLoader.register()
// export { GltfLoader }

// abstract class GLTFAccessorBase {
//   /**
//    * The gltf accessor definition
//    */
//   public readonly accessor: Accessor

//   /**
//    * Specifies if the attribute is a scalar, vector, or matrix.
//    */
//   public get attributeType() {
//     return this.accessor.type
//   }

//   /**
//    * The number of attributes referenced by this accessor.
//    *
//    * @remarks
//    * The number of attributes referenced by this accessor, not to be confused with the number of bytes or number of components.
//    */
//   public get attributeCount() {
//     return this.accessor.count
//   }

//   /**
//    * The number Number of components in one attribute
//    */
//   public get componentCount() {
//     switch (this.attributeType) {
//       case 'SCALAR':
//         return 1
//       case 'VEC2':
//         return 2
//       case 'VEC3':
//         return 3
//       case 'VEC4':
//         return 4
//       case 'MAT2':
//         return 4
//       case 'MAT3':
//         return 9
//       case 'MAT4':
//         return 16
//     }
//   }

//   /**
//    * Specifies if the component is a byte, float, short etc.
//    */
//   public get componentType() {
//     return this.accessor.componentType
//   }

//   /**
//    * The size in bytes of a single component
//    */
//   public get componentSize(): number {
//     switch (this.accessor.componentType) {
//       case AccessorComponentType.BYTE:
//         return 1
//       case AccessorComponentType.FLOAT:
//         return 4
//       case AccessorComponentType.SHORT:
//         return 2
//       case AccessorComponentType.UNSIGNED_BYTE:
//         return 1
//       case AccessorComponentType.UNSIGNED_INT:
//         return 4
//       case AccessorComponentType.UNSIGNED_SHORT:
//         return 2
//     }
//   }

//   public readonly byteOffset: number
//   public readonly byteStride: number

//   public abstract readonly data: AnyTypedArray

//   constructor(accessor: Accessor) {
//     this.accessor = accessor
//     this.byteOffset = accessor.byteOffset || 0
//     this.byteStride = this.componentSize * this.componentCount
//   }

//   public getDataWithoutOffset() {
//     if (this.byteOffset) {
//       const componentCount = this.byteStride / this.componentSize
//       const result = createTypedArray(
//         {
//           buffer: this.data.buffer,
//           byteOffset: this.data.byteOffset + this.byteOffset,
//           count: this.attributeCount * componentCount,
//         },
//         this.componentType,
//       )
//       return result
//     }
//     return this.data
//   }

//   public abstract readComponent(aIndex: number, cIndex: number): number
//   // public abstract readAttribute(index: number, target: number[]): number[]

//   public readV3(aIndex: number) {
//     return {
//       x: this.readComponent(aIndex, 0),
//       y: this.readComponent(aIndex, 1),
//       z: this.readComponent(aIndex, 2),
//     }
//   }

//   public readV4(aIndex: number) {
//     return {
//       x: this.readComponent(aIndex, 0),
//       y: this.readComponent(aIndex, 1),
//       z: this.readComponent(aIndex, 2),
//       w: this.readComponent(aIndex, 3),
//     }
//   }
// }

// class GLTFBufferViewAccessor extends GLTFAccessorBase {
//   public readonly data: AnyTypedArray
//   private stride: number
//   private offset: number

//   constructor(public readonly accessor: Accessor, buffer: ArrayBuffer, view: Omit<BufferView, 'buffer'>) {
//     super(accessor)
//     this.offset = this.byteOffset / this.componentSize
//     if (view.byteStride) {
//       this.stride = view.byteStride / this.componentSize
//     } else {
//       this.stride = this.componentCount
//     }
//     this.data = createTypedArray(
//       {
//         buffer: buffer,
//         byteOffset: view.byteOffset,
//         count: this.offset + this.attributeCount * this.stride,
//       },
//       this.componentType,
//     )
//   }

//   public readComponent(aIndex: number, cIndex: number): number {
//     return this.data[this.offset + aIndex * this.stride + cIndex]
//   }
// }

// class GLTFSparseAccessor extends GLTFAccessorBase {
//   public readonly data: AnyTypedArray

//   constructor(
//     public readonly accessor: Accessor,
//     public readonly indices: AnyTypedArray,
//     public readonly valuesView: Omit<BufferView, 'buffer'>,
//     public readonly valuesArray: AnyTypedArray,
//   ) {
//     super(accessor)
//     this.data = new ArrayType[this.componentType](this.componentSize * this.componentCount * this.attributeCount)
//     for (let i = 0; i < this.indices.length; i++) {
//       const index = this.indices[i]
//       const value = valuesArray[i] // TODO: buteOffset etc.
//       this.writeComponent(index, 0, value)
//     }
//   }

//   public readComponent(aIndex: number, cIndex: number): number {
//     return this.data[aIndex * this.componentCount + cIndex]
//   }

//   private writeComponent(aIndex: number, cIndex: number, value: number) {
//     this.data[aIndex * this.componentCount + cIndex] = value
//   }
// }

// function createTypedArray(
//   spec: { buffer: ArrayBuffer; byteOffset?: number; count: number },
//   type: number,
// ): AnyTypedArray {
//   const TYPE = ArrayType[type]
//   const result = new TYPE(spec.buffer, spec.byteOffset || 0, spec.count)
//   return result
// }

// const ArrayType = Object.freeze({
//   0x1400: Int8Array,
//   0x1402: Int16Array,
//   0x1404: Int32Array,
//   0x1401: Uint8Array,
//   0x1403: Uint16Array,
//   0x1405: Uint32Array,
//   0x1406: Float32Array,
//   0x8363: Uint16Array,
//   0x8033: Uint16Array,
//   0x8034: Uint16Array,
// })

// type AnyTypedArray =
//   | Int8Array<ArrayBuffer>
//   | Int16Array<ArrayBuffer>
//   | Int32Array<ArrayBuffer>
//   | Uint8Array<ArrayBuffer>
//   | Uint16Array<ArrayBuffer>
//   | Uint32Array<ArrayBuffer>
//   | Float32Array<ArrayBuffer>
//   | Uint16Array<ArrayBuffer>
//   | Uint16Array<ArrayBuffer>
//   | Uint16Array<ArrayBuffer>
