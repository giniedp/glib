import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { copy, Log } from '@gglib/utils'
import { BufferOptions } from './Buffer'
import { Color } from './Color'
import { Device } from './Device'
import { Model, ModelOptions } from './Model'
import { ModelMesh, ModelMeshOptions } from './ModelMesh'
import { VertexLayout, VertexPreset } from './VertexLayout'

import { BufferType, DataType, FrontFace } from './enums'
import { calculateNormals } from './formulas/calculateNormals'
import { calculateTangents } from './formulas/calculateTangents'
import { ModelBuilderChannel, ModelBuilderChannelMap } from './ModelBuilderChannel'

let tmpBuffer: any[] = []

/**
 * @public
 */
export interface ModelBuilderOptions {
  /**
   * Mapping of attribute name to its default value
   */
  defaultAttributes?: { [key: string]: number[] }
  /**
   * The vertex buffer layout
   */
  layout?: string | VertexLayout | Array<string | VertexLayout>
}

/**
 * A mesh building formula function
 */
export type ModelBuildFormula<T = any> = (builder: ModelBuilder, options: T) => void

/**
 * @public
 */
export class ModelBuilder {

  /**
   * Creates a new model builder
   *
   * @remarks simply calls the constructor with given options
   *
   * @param options the constructor options
   */
  public static begin(options?: ModelBuilderOptions): ModelBuilder {
    return new ModelBuilder(options)
  }

  public get indices(): number[] {
    return this.iBuffer.data
  }

  public get indexCount(): number {
    return this.iBuffer.data.length
  }

  public get vertexCount(): number {
    return this.vCount
  }

  public defaultAttributes: { [key: string]: number[] }
  private layout: VertexLayout[]
  private meshes: ModelMeshOptions[] = []

  private iBuffer: BufferOptions<number[]>
  private vBuffer: Array<BufferOptions<number[]>>
  private vCount: number

  private bBox: BoundingBox
  private bSphere: BoundingSphere

  private transformStack: Mat4[] = []
  private channels: ModelBuilderChannelMap

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
    this.defaultAttributes = {
      position: [0, 0, 0],
      normal: [0, 1, 0],
      tangent: [1, 0, 0],
      bitangent: [0, 0, 1],
      color: [Color.Black.rgba],
      texture: [0, 0],
      ...(options.defaultAttributes || {}),
    }

    this.reset()
  }

  /**
   * Pushes a transform matrix to transform all subsequent vertices (positions and normals)
   *
   * @param transform the transform matrix
   */
  public beginTransform(transform: Mat4): number {
    let id = this.transformStack.length
    let last = this.transformStack[id - 1]
    if (last) {
      this.transformStack[id] = Mat4.multiply(transform, last)
    } else {
      this.transformStack[id] = transform.clone()
    }
    return id
  }

  /**
   * Pops transform matrices from stack up until the given id
   *
   * @param id the id that has been returned byt a call to `beginTransform`
   */
  public endTransform(id: number) {
    this.transformStack.length = id
  }

  /**
   * Pushes and pops tranform matrix to/from the stack around the given callback
   *
   * @param transform the transform matrix
   * @param callback the callback
   */
  public withTransform(transform: Mat4, callback: (builder: ModelBuilder) => void): ModelBuilder {
    const id = this.beginTransform(transform)
    callback(this)
    this.endTransform(id)
    return this
  }

  public getChannel(name: string) {
    return this.channels[name]
  }

  private resetTransform() {
    this.transformStack.length = 0
  }

  private resetData() {
    // The new index buffer that is going to be filled with indices
    this.iBuffer = {
      type: BufferType.IndexBuffer,
      dataType: DataType.ushort,
      data: [],
    }

    // The new index buffer that is going to be filled with vertices
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

  private resetMeshes() {
    this.meshes = []
  }

  private makeChannels() {
    this.channels = ModelBuilderChannel.createMap(this.vBuffer)
  }

  /**
   * Resets the builder state
   */
  public reset() {
    this.resetTransform()
    this.resetData()
    this.resetMeshes()
    return this
  }

  /**
   * Pushes given indices into the state.
   */
  public addIndex(index: number): ModelBuilder {
    this.iBuffer.data.push(index)
    return this
  }

  /**
   * Pushes a single vertex definition into the state
   *
   */
  public addVertex(vertex: {[key: string]: number[] | number | { toArray: (buf: number[]) => void }}): ModelBuilder {
    const transform = this.transformStack[this.transformStack.length - 1]
    const defaults = this.defaultAttributes

    Object.keys(this.channels).forEach((name) => {
      const channel = this.channels[name]
      let item = vertex[name] || defaults[name]

      if (Array.isArray(item)) {
        // ok
      } else if (typeof item === 'number') {
        tmpBuffer.length = 1
        tmpBuffer[0] = item
        item = tmpBuffer
      } else if (typeof item.toArray === 'function') {
        tmpBuffer.length = channel.elements
        item.toArray(tmpBuffer)
        item = tmpBuffer
      } else {
        throw new Error(`vertex attribute must be either a "number" or "number[]" or have "toArray" method. type was '${typeof item}'`)
      }

      if (!transform) {
        // ok
      } else if (name === 'position') {
        transform.transformV3Buffer(item)
      } else if (name.match('normal|tangent')) {
        transform.transformNormalBuffer(item)
      } else if (name.match('texture|uv|texcoord')) {
        // TODO: transform texture
      }

      channel.writeAttribute(this.vCount, item)
    })

    this.vCount += 1
    return this
  }

  public calculateBoundings() {
    this.getChannel('position').forEach((item, i) => {
      if (i === 0) {
        this.bSphere.center.x = item[0]
        this.bSphere.center.y = item[1]
        this.bSphere.center.z = item[2]

        this.bBox.min.x = item[0]
        this.bBox.min.y = item[1]
        this.bBox.min.z = item[2]

        this.bBox.max.x = item[0]
        this.bBox.max.y = item[1]
        this.bBox.max.z = item[2]
      } else {
        this.bSphere.mergePoint({ x: item[0], y: item[1], z: item[2] })
        this.bBox.mergePoint({ x: item[0], y: item[1], z: item[2] })
      }
    })
    return this
  }

  public calculateNormals(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): ModelBuilder {
    if (!this.channels.normal && create) {
      this.ensureLayoutChannel('normal')
    }
    if (this.channels.normal) {
      calculateNormals(this.iBuffer.data, this.channels, this.vCount, frontFace)
    }
    return this
  }

  public calculateTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): ModelBuilder {
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

  public calculateNormalsAndTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): ModelBuilder {
    this.calculateNormals(create, frontFace)
    this.calculateTangents(create, frontFace)
    return this
  }

  public ensureLayoutChannel(name: string, channel: VertexPreset = VertexLayout.preset[name]) {
    if (this.channels[name]) {
      return
    }
    if (!channel) {
      throw new Error(`unknown channel preset for '${name}'`)
    }

    const data = []
    for (let i = 0; i < this.vCount; i++) {
      if (this.defaultAttributes[name] && this.defaultAttributes[name].length === channel.elements) {
        data.push(...this.defaultAttributes[name])
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

  public mergeDublicates(): ModelBuilder {
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
    const vChannels = ModelBuilderChannel.createMap(vBuffer)
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

  // public groupBy(fn: (index: number) => string): Map<string, ModelBuilder> {
  //   const groups = new Map<string, ModelBuilder>()
  //   const indexMap = new Map<number, string>()
  //   this.iBuffer.data.forEach((index) => {
  //     if (!indexMap.has(index)) {
  //       indexMap.set(index, fn(index))
  //     }
  //     const groupName = indexMap.get(index)
  //     let group = groups.get(groupName)
  //     if (!group) {
  //       group = new ModelBuilder({
  //         layout: this.layout.map((it) => {
  //           return { ...it }
  //         }),
  //         defaultAttributes: { ...this.defaultAttributes },
  //       })
  //       groups.set(groupName, group)
  //     }
  //   })

  //   return map
  // }

  /**
   * Creates new mesh options with current index and vertex buffer and saves them in the meshes array.
   *
   * @param options - options to start with
   */
  public endMesh(options?: ModelMeshOptions): ModelMeshOptions
  /**
   * Creates new mesh with current index and vertex buffer and saves them in the meshes array.
   *
   * @param device - the graphics device
   * @param options - options to start with
   */
  public endMesh(device: Device, options?: ModelMeshOptions): ModelMesh
  public endMesh(): ModelMesh | ModelMeshOptions {
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

    if (this.indexCount === 0 && this.vCount === 0) {
      Log.w(`[ModelBuilder] endMesh called on empty builder. ignore.`)
      return result
    }

    options.materialId = options.materialId || 0
    options.indexBuffer = this.iBuffer
    options.vertexBuffer = this.vBuffer
    options.boundingBox = this.bBox
    options.boundingSphere = this.bSphere

    this.meshes.push(options)
    this.resetData()

    if (device) {
      result = new ModelMesh(device, options)
    }

    return result
  }

  /**
   * Creates model options from the current builder state an resets the builder.
   *
   * @param options - The custom model options to be used. The 'meshes' option is ignored.
   */
  public endModel(options?: ModelOptions): ModelOptions
  /**
   * Creates a model from the current builder state and resets the builder.
   *
   * @param device - The graphics device
   * @param options - The model options.
   */
  public endModel(device: Device, options?: ModelOptions): Model
  public endModel(): Model | ModelOptions {
    if (this.indexCount !== 0 || this.vertexCount !== 0) {
      this.endMesh()
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

    let materials = options.materials || []
    if (!Array.isArray(materials)) {
      materials = [materials]
    }
    options.materials = materials
    options.meshes = this.meshes
    this.reset()

    if (device) {
      result = device.createModel(options)
    }

    return result
  }

  /**
   * Calls the given function with `this` as argument for manipulation
   *
   * @example
   * return ModelBuilder.begin().tap((b) => {
   *   buildMyFancyMesh(b)
   * }).endModel(...)
   *
   * @param fn - The function to call with this model builder
   */
  public tap(fn: (builder: this) => void): this {
    fn(this)
    return this
  }
}
