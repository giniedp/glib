import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { copy, Log, isArray } from '@gglib/utils'
import { Color } from './Color'
import { Device } from './Device'
import { Model, ModelOptions } from './Model'
import { ModelMeshPart, ModelMeshPartOptions } from './ModelMeshPart'
import { BufferOptions } from './resources'
import { VertexLayout } from './VertexLayout'

import { BufferType, DataType, FrontFace } from './enums'
import { calculateNormals } from './formulas/calculateNormals'
import { calculateTangents } from './formulas/calculateTangents'
import { ModelBuilderChannel, ModelBuilderChannelMap } from './ModelBuilderChannel'
import { ModelMeshOptions, ModelMesh } from './ModelMesh'

/**
 * A function that adds geometry into a given {@link ModelBuilder}
 *
 * @public
 */
export type ModelBuilderFunction<T> = (b: ModelBuilder, options?: T) => void

/**
 * Constructor options for {@link ModelBuilder}
 *
 * @public
 */
export interface ModelBuilderOptions {
  /**
   * Mapping of attribute name to its default value
   */
  defaults?: { [key: string]: number[] }
  /**
   * The vertex buffer layout
   */
  layout?: string | VertexLayout | Array<string | VertexLayout>
}

/**
 * A helper class for building 3d geometries
 *
 * @public
 */
export class ModelBuilder {

  /**
   * Creates a new model builder
   *
   * @remarks simply calls the constructor with given options
   *
   * @param options - the constructor options
   */
  public static begin(options?: ModelBuilderOptions): ModelBuilder {
    return new ModelBuilder(options)
  }

  /**
   * Gets the indices in current state
   */
  public get indices(): ReadonlyArray<number>  {
    return this.iBuffer.data
  }

  /**
   * The index count in current state
   */
  public get indexCount(): number {
    return this.iBuffer.data.length
  }

  /**
   * The vertex count in current state
   */
  public get vertexCount(): number {
    return this.vCount
  }

  /**
   * A map of default attributes
   *
   * @remarks
   * If {@link addVertex} is called with missing attributes, this is where
   * the default values are resolved from
   */
  public defaults: { [key: string]: number[] }

  private layout: VertexLayout[]
  private meshParts: ModelMeshPartOptions[] = []
  private meshes: ModelMeshOptions[] = []

  private iBuffer: BufferOptions<number[]>
  private vBuffer: Array<BufferOptions<number[]>>
  private vCount: number

  private bBox: BoundingBox
  private bSphere: BoundingSphere

  private transformStack: Mat4[] = []
  private channels: ModelBuilderChannelMap
  private tmp: any[] = []

  /**
   * Creates a new instance of the ModelBuilder
   *
   * @param options
   * @example
   * new ModelBuilder({ layout: 'PositionTexture' })
   */
  constructor(options: ModelBuilderOptions = {}) {
    if (Array.isArray(options.layout) && options.layout.length > 0) {
      this.layout = options.layout.map(VertexLayout.convert)
    } else if (options.layout) {
      this.layout = [options.layout].map(VertexLayout.convert)
    } else {
      this.layout = [
        VertexLayout.convert('PositionTexture'),
        VertexLayout.convert('Normal'),
        VertexLayout.convert('TangentBitangent'),
      ]
    }

    // The fallback values that should be used during the build process.
    // If any vertex is pushed into the builder with missing attributes they are resolved from here.
    this.defaults = {
      position: [0, 0, 0],
      normal: [0, 1, 0],
      tangent: [1, 0, 0],
      bitangent: [0, 0, 1],
      color: [Color.Black.rgba],
      texture: [0, 0],
      ...(options.defaults || {}),
    }

    this.reset()
  }

  /**
   * Pushes a transform matrix to transform all subsequent vertices (positions and normals)
   *
   * @param transform - the transform matrix
   */
  public beginTransform(transform: Mat4): number {
    let id = this.transformStack.length
    let last = this.transformStack[id - 1]
    if (last) {
      this.transformStack[id] = Mat4.premultiply(transform, last)
    } else {
      this.transformStack[id] = transform.clone()
    }
    return id
  }

  /**
   * Pops transform matrices from stack up until the given id
   *
   * @param id - the id that has been returned byt a call to `beginTransform`
   */
  public endTransform(id: number) {
    if (id > this.transformStack.length) {
      this.transformStack.length = id
    }
  }

  /**
   * Pushes and pops transform matrix to/from the stack around the given callback
   *
   * @param transform - the transform matrix
   * @param callback - the callback
   */
  public withTransform(transform: Mat4, callback: (builder: ModelBuilder) => void): this {
    const id = this.beginTransform(transform)
    callback(this)
    this.endTransform(id)
    return this
  }

  /**
   * Gets a data channel of current state by its semantic name
   *
   * @param name - the data channel name e.g. 'position'
   */
  public getChannel(name: string) {
    return this.channels[name]
  }

  private resetData() {
    this.iBuffer = {
      type: BufferType.IndexBuffer,
      dataType: DataType.ushort,
      data: [],
    }
    this.vBuffer = this.layout.map((l): BufferOptions<number[]> => {
      return {
        layout: copy(l),
        type: BufferType.VertexBuffer,
        dataType: 'float',
        data: [],
      }
    })

    this.vCount = 0

    this.bBox = new BoundingBox()
    this.bSphere = new BoundingSphere()
    this.makeChannels()
  }

  private makeChannels() {
    this.channels = ModelBuilderChannel.fromVertexBuffer(this.vBuffer)
  }

  /**
   * Resets the builder state.
   *
   * @remarks
   * Any open state will be lost
   */
  public reset() {
    this.resetData()
    this.transformStack.length = 0
    this.meshParts.length = 0
    this.meshes.length = 0
    return this
  }

  /**
   * Pushes a single index into current state.
   */
  public addIndex(index: number): this {
    this.iBuffer.data.push(index)
    return this
  }

  /**
   * Pushes a single vertex definition into current state
   *
   * @remarks
   * The given vertex should contain all attributes for current layout. If any attribute is missing
   * a default value will be used: see {@link defaults}
   */
  public addVertex(vertex: {[key: string]: ReadonlyArray<number> | number | { toArray: (buf: number[]) => void }}): this {
    const transform = this.transformStack[this.transformStack.length - 1]
    const defaults = this.defaults
    const tmpBuffer = this.tmp

    Object.keys(this.channels).forEach((name) => {
      const channel = this.channels[name]
      let item = vertex[name] || defaults[name]

      if (isArray(item)) {
        // ok
      } else if (typeof item === 'number') {
        tmpBuffer.length = 1
        tmpBuffer[0] = item
        item = tmpBuffer
      } else if ('toArray' in item && typeof item.toArray === 'function') {
        tmpBuffer.length = channel.elements
        item.toArray(tmpBuffer)
        item = tmpBuffer
      } else {
        throw new Error(`vertex attribute must be either a "number" or "number[]" or have "toArray" method. type was '${typeof item}'`)
      }

      if (!transform) {
        // ok
      } else if (name === 'position') {
        transform.transformV3Array(item)
      } else if (name.match('normal|tangent')) {
        transform.transformV3NormalArray(item)
      }

      channel.writeAttribute(this.vCount, item)
    })

    this.vCount += 1
    return this
  }

  public calculateBoundings() {
    this.bBox.init(0, 0, 0, 0, 0, 0)

    this.getChannel('position').forEach((item, i) => {
      if (i === 0) {
        this.bBox.min.x = item[0]
        this.bBox.min.y = item[1]
        this.bBox.min.z = item[2]

        this.bBox.max.x = item[0]
        this.bBox.max.y = item[1]
        this.bBox.max.z = item[2]
      } else {
        this.bBox.mergePoint({ x: item[0], y: item[1], z: item[2] })
      }
    })
    this.bSphere.initFromBox(this.bBox)
    return this
  }

  public calculateNormals(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    if (!this.channels.normal && create) {
      this.ensureLayoutChannel('normal')
    }
    if (this.channels.normal) {
      calculateNormals(this.iBuffer.data, this.channels, this.vCount, frontFace)
    }
    return this
  }

  public calculateTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    if (!this.channels.tangent && create) {
      this.ensureLayoutChannel('tangent')
    }
    if (!this.channels.bitangent && create) {
      this.ensureLayoutChannel('bitangent')
    }
    if (this.channels.tangent && this.channels.bitangent) {
      calculateTangents(this.iBuffer.data, this.channels, this.vCount, frontFace)
    }
    return this
  }

  public calculateNormalsAndTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    this.calculateNormals(create, frontFace)
    this.calculateTangents(create, frontFace)
    return this
  }

  /**
   * For current state it ensures that the vertex buffer contains a channel with given semantic name
   *
   * @remarks
   * Does nothing if a channel with given semantic name already exists.
   * Otherwise adds a channel with given name to the vertex buffer and fills it with default values: see {@link defaults}
   *
   * This does not operate on already closed mesh parts. When building a model with multiple
   * meshes or parts, this must be called each time before closing a part.
   */
  public ensureLayoutChannel(name: string, channel = VertexLayout.preset[name]) {
    if (this.channels[name]) {
      return
    }
    if (!channel) {
      throw new Error(`preset for is '${name}' missing`)
    }

    const data = []
    for (let i = 0; i < this.vCount; i++) {
      if (this.defaults[name] && this.defaults[name].length === channel.elements) {
        data.push(...this.defaults[name])
      } else {
        for (let j = 0; j < channel.elements; j++) {
          data.push(0)
        }
      }
    }
    const layout: VertexLayout = {
      [name]: {
        ...channel,
        offset: 0,
      },
    }
    this.layout.push(layout)
    this.vBuffer.push({
      layout: layout,
      type: BufferType.VertexBuffer,
      dataType: 'float',
      data: data,
    })
    this.makeChannels()
  }

  /**
   * In current state it reads through the vertex buffer and eliminates redundant vertices
   *
   * @remarks
   * This does not operate on already closed mesh parts. When building a model with multiple
   * meshes or parts, this must be called each time before closing a part.
   */
  public mergeDublicates(): this {
    // vertex index cache
    const hashMap = new Map<string, number>()
    // the new vertex buffer
    const vBuffer = this.vBuffer.map((buf) => {
      return {
        ...buf,
        data: [],
      }
    })
    // accessor to new vertex buffer
    const vChannels = ModelBuilderChannel.fromVertexBuffer(vBuffer)
    // new vertex count
    let vCount = 0
    // new indices
    let newIndices: any = []

    const vertex: number[] = []
    const channelNames = Object.keys(this.channels)

    for (let index of this.iBuffer.data) {
      // build vertex object
      vertex.length = 0
      for (const name of channelNames) {
        const channel = this.channels[name]
        const elements = channel.elements
        for (let i = 0; i < elements; i++) {
          vertex.push(channel.read(index, i))
        }
      }
      // build vertex hash value
      const hash = vertex.join('|')
      if (!hashMap.has(hash)) {
        // write back new vertex
        for (const name of channelNames) {
          const channel = vChannels[name]
          const elements = channel.elements
          for (let i = 0; i < elements; i++) {
            channel.write(vCount, i, vertex.shift())
          }
        }
        // remember vertex position
        hashMap.set(hash, vCount)
        vCount += 1
      }
      newIndices.push(hashMap.get(hash))
    }

    if (this.vCount !== vCount) {
      Log.d(`[ModelBuilder] Mesh size reduced from ${this.vCount} to ${vCount} vertices.`)
      this.vBuffer = vBuffer
      this.channels = vChannels
      this.vCount = vCount
      this.iBuffer.data = newIndices
    }
    return this
  }

  /**
   * Same as {@link endMeshPart} but returns the builder for chaining
   *
   * @param options - options for `endMeshPart`
   */
  public closeMeshPart(options?: ModelMeshPartOptions): this {
    this.endMeshPart(options)
    return this
  }

  /**
   * Creates new mesh options with current index and vertex buffer and saves them in the meshes array.
   *
   * @param options - options to start with
   * @returns ModelMeshPartOptions or null if current state has no mesh part data
   */
  public endMeshPart(options?: ModelMeshPartOptions): ModelMeshPartOptions | null
  /**
   * Creates new mesh with current index and vertex buffer and saves them in the meshes array.
   *
   * @param device - the graphics device
   * @param options - options to start with
   * @returns ModelMeshPart or null if current state has no mesh part data
   */
  public endMeshPart(device: Device, options?: ModelMeshPartOptions): ModelMeshPart | null
  public endMeshPart(): ModelMeshPart | ModelMeshPartOptions {
    if (this.indexCount === 0 || this.vertexCount === 0) {
      return null
    }

    let device: Device
    let options: ModelMeshPartOptions
    let result: ModelMeshPartOptions | ModelMeshPart
    if (arguments[0] instanceof Device) {
      device = arguments[0]
      options = arguments[1] || {}
      result = null
    } else {
      device = null
      options = arguments[0] || {}
      result = options
    }

    options.materialId = options.materialId || 0
    options.indexBuffer = this.iBuffer
    options.vertexBuffer = this.vBuffer
    options.boundingBox = this.bBox
    options.boundingSphere = this.bSphere

    this.meshParts.push(options)
    this.resetData()

    if (device) {
      result = new ModelMeshPart(device, options)
    }

    return result
  }

  /**
   * Same as {@link endMesh} but returns the builder for chaining
   *
   * @param options - options for `endMesh`
   */
  public closeMesh(options?: ModelMeshOptions): this {
    this.endMesh(options)
    return this
  }

  /**
   * From current state it creates {@link ModelMeshOptions} and prepares the builder for the next mesh
   *
   * @param options - Additional {@link ModelMeshOptions} . The {@link ModelMeshOptions.parts} option is ignored.
   * @returns `ModelMeshOptions` or `null` if current state has no mesh data
   */
  public endMesh(options?: ModelMeshOptions): ModelMeshOptions | null
  /**
   * From current state it creates in instance of {@link ModelMesh} and prepares the builder for the next mesh
   *
   * @param device - The graphics device
   * @param options - Additional {@link ModelMeshOptions} . The {@link ModelMeshOptions.parts} option is ignored.
   * @returns `ModelMesh` or `null` if current state has no mesh data
   */
  public endMesh(device: Device, options?: ModelMeshOptions): ModelMesh | null
  public endMesh(): Model | ModelMeshOptions {
    this.endMeshPart()
    if (!this.meshParts.length) {
      return null
    }

    let device: Device
    let options: ModelMeshOptions
    let result: ModelMeshOptions | ModelMesh
    if (arguments[0] instanceof Device) {
      device = arguments[0]
      options = arguments[1] || {}
      result = null
    } else {
      device = null
      options = arguments[0] || {}
      result = options
    }

    let materials = options.materials || []
    if (!Array.isArray(materials)) {
      materials = [materials]
    }
    options.materials = materials
    options.parts = this.meshParts

    if (!options.boundingBox && this.meshParts.every((mesh) => !!mesh.boundingBox)) {
      options.boundingBox = this.meshParts.reduce((box, mesh) => {
        const meshBox = BoundingBox.convert(mesh.boundingBox)
        return box ? box.merge(meshBox) : BoundingBox.createFrom(meshBox)
      }, null as BoundingBox)
    }
    if (!options.boundingSphere && options.boundingBox) {
      options.boundingSphere = BoundingSphere.createFromBox(BoundingBox.convert(options.boundingBox)).toArray()
    }

    this.meshes.push(options)
    this.meshParts = []
    this.resetData()

    if (device) {
      result = new ModelMesh(device, options)
    }

    return result
  }

  /**
   * From current state it creates {@link ModelOptions} and resets the builder
   *
   * @param options - Additional {@link ModelOptions}. The {@link ModelOptions.meshes} option is ignored.
   * @returns ModelOptions or null if current state has no model data
   */
  public endModel(options?: ModelOptions): ModelOptions | null
  /**
   * From current state it creates a {@link Model} instance and resets the builder
   *
   * @param device - The graphics device
   * @param options - Additional {@link ModelOptions}. The {@link ModelOptions.meshes} option is ignored.
   * @returns Model or null if current state has no model data
   */
  public endModel(device: Device, options?: ModelOptions): Model | null
  public endModel(): Model | ModelOptions {
    this.endMesh()
    if (!this.meshes.length) {
      return null
    }

    let device: Device
    let options: ModelOptions
    let result: ModelOptions | Model
    if (arguments[0] instanceof Device) {
      device = arguments[0]
      options = arguments[1] || {}
      result = null
    } else {
      device = null
      options = arguments[0] || {}
      result = options
    }

    options.meshes = this.meshes
    this.meshes = []
    this.reset()

    if (device) {
      result = device.createModel(options)
    }

    return result
  }

  /**
   * Calls the given model builder function to add geometry to current state
   *
   * @param builderFn - The model builder function to call
   * @param options - The model builder options to use
   */
  public append<T>(builderFn: ModelBuilderFunction<T>, options?: T) {
    builderFn(this, options)
    return this
  }
}
