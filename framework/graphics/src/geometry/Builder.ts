import { copy, logger } from '@glib/core'
import { BoundingBox, BoundingSphere, Mat2, Mat3, Mat4 } from '@glib/math'
import { BufferData, BufferOptions } from '../Buffer'
import { Color } from '../Color'
import { Device } from '../Device'
import { Model, ModelOptions } from '../Model'
import { ModelMesh, ModelMeshOptions } from '../ModelMesh'
import { VertexLayout } from '../VertexLayout'
import { calculateNormals } from './calculateNormals'
import { calculateTangents } from './calculateTangents'

let tmpBuffer: any[] = []

export interface BuilderOptions {
  defaultAttributes?: { [key: string]: any }
  layout?: string|{ [key: string]: any }
  ignoreTransform?: boolean
}

export class Builder {
  private defaultAttributes: {[key: string]: any}
  private layout: {[key: string]: any}
  private meshes: ModelMeshOptions[] = []

  private indexBuffer: BufferOptions
  private indexCount: number
  private sGroups: number[]
  private vertexBuffer: BufferOptions
  public vertexCount: number
  public maxVertexCount = 65536
  private boundingBox: BoundingBox
  private boundingSphere: BoundingSphere

  private transformStack: Mat4[] = []

  constructor(options: BuilderOptions = {}) {
    this.layout = VertexLayout.convert(options.layout || 'PositionTextureNormalTangentBitangent')

    // The fallback values that should be used during the build process.
    // If any vertex is pushed into the builder with missing attributes they are resolved from here.
    this.defaultAttributes = options.defaultAttributes || {
        position: [0, 0, 0],
        normal: [0, 1, 0],
        tangent: [1, 0, 0],
        bitangent: [0, 0, 1],
        color: [Color.Black],
        texture: [0, 0],
      }

    this.reset()
  }

  /**
   * Gets the data array of the current index buffer
   * @returns {BufferData}
   */
  get indices(): BufferData {
    return this.indexBuffer.data
  }
  set indices(value: BufferData) {
    this.indexBuffer.data = value
  }

  /**
   * Gets the data array of the current vertex buffer
   * @returns {BufferData}
   */
  get vertices(): BufferData {
    return this.vertexBuffer.data
  }
  set vertices(value: BufferData) {
    this.vertexBuffer.data = value
  }

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
  public endTransform(id: number) {
    this.transformStack.length = id
  }

  public static begin(options?: BuilderOptions) {
    return new Builder(options)
  }

  private resetTransform() {
    this.transformStack.length = 0
    // this.transform = Mat4.identity();
    // this.uvTransform = Mat4.identity();
    return this
  }

  private resetData() {
    // The new index buffer that is going to be filled with indices
    this.indexBuffer = {
      type: 'IndexBuffer',
      dataType: 'ushort',
      data: [],
    }

    // The new index buffer that is going to be filled with vertices
    this.vertexBuffer = {
      layout: copy(this.layout),
      type: 'VertexBuffer',
      dataType: 'float',
      data: [],
    }

    // counter values
    this.indexCount = 0
    this.vertexCount = 0
    this.sGroups = []

    this.boundingBox = new BoundingBox()
    this.boundingSphere = new BoundingSphere()
  }

  private resetMeshes() {
    this.meshes = []
  }

  /**
   * Resets the builder state
   * @returns {Glib.Graphics.Geometry.Builder}
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
  public addIndex(index: number, sGroup?: number) {
    this.indices.push(index)
    this.sGroups.push(sGroup)
    this.indexCount += 1
    return this
  }

  /**
   * Pushes a single vertex definition into the state
   * @param vertex
   * @returns {Glib.Graphics.Geometry.Builder}
   */
  public addVertex(vertex: {[key: string]: any}): Builder {
    if (this.vertexCount === this.maxVertexCount) {
      // throw `max vertex count reached`;
    }
    let transform = this.transformStack[this.transformStack.length - 1]
    let layout = this.vertexBuffer.layout
    let defaults = this.defaultAttributes

    for (let key of Object.keys(layout)) {
      let channel = layout[key]
      let item = vertex[key] || defaults[key]

      if (Array.isArray(item)) {
        // ok
      } else if (typeof item.copyTo === 'function') {
        tmpBuffer.length = channel.packed ? 1 : channel.elements
        item.copyTo(tmpBuffer)
        item = tmpBuffer
      } else if (typeof item === 'number') {
        tmpBuffer.length = 1
        tmpBuffer[0] = item
        item = tmpBuffer
      } else {
        throw new Error(`vertex element type must be one of number|number[]|Vec2|Vec3|Vec4`)
      }

      if (!transform) {
        if (key === 'position') {
          this.mergeBounding(item)
        }
      } else if (key === 'position') {
        transform.transformV3Buffer(item)
        this.mergeBounding(item)
      } else if (key.match('normal|tangent')) {
        transform.transformNormalBuffer(item)
      } else if (key.match('texture|uv')) {
        // TODO:
        // this.uvTransform.transformV2Buffer(item);
      }

      let count = channel.packed ? 1 : channel.elements
      for (let i = 0; i < count; i += 1) {
        this.vertices.push(item[i] || 0)
      }
    }

    this.vertexCount += 1
    return this
  }

  private mergeBounding(item: number[]) {
    if (this.vertexCount === 0) {
      this.boundingSphere.center.x = item[0]
      this.boundingSphere.center.y = item[1]
      this.boundingSphere.center.z = item[2]

      this.boundingBox.min.x = item[0]
      this.boundingBox.min.y = item[1]
      this.boundingBox.min.z = item[2]

      this.boundingBox.max.x = item[0]
      this.boundingBox.max.y = item[1]
      this.boundingBox.max.z = item[2]
    } else {
      this.boundingSphere.mergePoint({ x: item[0], y: item[1], z: item[2] })
      this.boundingBox.mergePoint({ x: item[0], y: item[1], z: item[2] })
    }
  }

  public calculateNormalsAndTangents() {
    if (this.layout['normal']) {
      calculateNormals(this.layout, this.indices, this.vertices)
    }
    if (this.layout['tangent'] && this.layout['bitangent']) {
      calculateTangents(this.layout, this.indices, this.vertices)
    }
  }

  public mergeDublicates() {
    let eCount = VertexLayout.countElements(this.layout)
    let hashMap = {}

    let oldIndices: any = this.indices
    let newIndices: any = []
    let iCounter = 0

    let oldVertices: any = this.vertices
    let newVertices: any = []
    let vCounter = 0

    for (let index of oldIndices) {
      let vertex = oldVertices.slice(index * eCount, index * eCount + eCount)
      let hash = vertex.join('|')
      let position = hashMap[hash]
      if (position == null) {
        for (let e of vertex) {
          newVertices.push(e)
        }
        position = vCounter
        hashMap[hash] = position
        vCounter += 1
      }

      newIndices[iCounter] = position
      iCounter += 1
    }

    if (this.vertexCount !== vCounter) {
      logger.debug(`[Geometry.Builder] Mesh size reduced from ${this.vertexCount} to ${vCounter} vertices.`)
      this.vertices = newVertices
      this.vertexCount = vCounter

      this.indices = newIndices
      this.indexCount = iCounter
    }
  }

  /**
   * Creates new mesh options with current index and vertex buffer and saves them in the meshes array.
   * @param options
   * @returns {Glib.Graphics.Geometry.Builder}
   */
  public endMeshOptions(options: ModelMeshOptions = {}, optimize: boolean = false): ModelMeshOptions {
    if (this.indexCount === 0 && this.vertexCount === 0) {
      logger.warn(`[Geometry.Builder] pushMesh : called on empty builder. ignore.`)
      return options
    }
    this.mergeDublicates()
    this.calculateNormalsAndTangents()

    options.materialId = options.materialId || 0
    options.indexBuffer = this.indexBuffer
    options.vertexBuffer = this.vertexBuffer
    options.boundingBox = this.boundingBox
    options.boundingSphere = this.boundingSphere

    this.meshes.push(options)
    this.resetData()
    return options
  }

  public endMesh(device: Device, optimize: boolean = false): ModelMesh {
    this.endMeshOptions()
    let opts = this.meshes[this.meshes.length - 1]
    return new ModelMesh(device, opts)
  }

  /**
   * Creates model options from the current builder state an resets the builder.
   * @param options The custom model options to be used. The 'meshes' option is ignored.
   * @returns {{materials: (Material[]|MaterialOptions[]|Array)}}
   */
  public finishModelOptions(options: ModelOptions = {}): ModelOptions {
    if (this.indices.length !== 0 || this.vertices.length !== 0) {
      this.endMeshOptions()
    }

    let materials = options.materials || []
    if (!Array.isArray(materials)) {
      materials = [materials]
    }
    options.materials = materials
    options.meshes = this.meshes
    this.reset()
    return options
  }

  /**
   * Creates a model from the current builder state and resets the builder.
   * @param {Glib.Graphics.Device} device The graphics device
   * @param {Glib.Graphics.ModelOptions} options The model options.
   * @returns {Model}
   */
  public finishModel(device: Device, options: ModelOptions = {}): Model {
    options = this.finishModelOptions(options)
    return device.createModel(options)
  }
}