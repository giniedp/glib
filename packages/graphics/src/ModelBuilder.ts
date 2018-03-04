import { copy, Log } from '@gglib/core'
import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { BufferDataOption, BufferOptions } from './Buffer'
import { Color } from './Color'
import { Device } from './Device'
import { Model, ModelOptions } from './Model'
import { ModelMesh, ModelMeshOptions } from './ModelMesh'
import { VertexLayout } from './VertexLayout'

import { formulas } from './formulas'
import { calculateNormals } from './formulas/calculateNormals'
import { calculateTangents } from './formulas/calculateTangents'

let tmpBuffer: any[] = []

export interface ModelBuilderOptions {
  defaultAttributes?: { [key: string]: number[] }
  layout?: string | VertexLayout
  ignoreTransform?: boolean
}

export type ModelBuildFormula = (builder: ModelBuilder, options: any) => void

export class ModelBuilder {
  public static formulas: { [key: string]: ModelBuildFormula } = formulas
  private defaultAttributes: {[key: string]: any}
  private layout: {[key: string]: any}
  private meshes: ModelMeshOptions[] = []

  private indexBuffer: BufferOptions<number[]>
  private indexCount: number
  private sGroups: number[]
  private vertexBuffer: BufferOptions<number[]>
  public vertexCount: number
  public maxVertexCount = 65536
  private boundingBox: BoundingBox
  private boundingSphere: BoundingSphere

  private transformStack: Mat4[] = []

  constructor(options: ModelBuilderOptions = {}) {
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
   */
  get indices(): number[] {
    return this.indexBuffer.data
  }
  set indices(value: number[]) {
    this.indexBuffer.data = value
  }

  /**
   * Gets the data array of the current vertex buffer
   */
  get vertices(): number[] {
    return this.vertexBuffer.data
  }
  set vertices(value: number[]) {
    this.vertexBuffer.data = value
  }

  public set transform(t: Mat4) {
    let id = this.transformStack.length
    this.transformStack[id] = t
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

  public withTransform(transform: Mat4, callback: (builder: ModelBuilder) => void): ModelBuilder {
    const id = this.beginTransform(transform)
    callback(this)
    this.endTransform(id)
    return this
  }

  public static begin(options?: ModelBuilderOptions) {
    return new ModelBuilder(options)
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
   */
  public addVertex(vertex: {[key: string]: number[] | number | { copy: (buf: number[]) => any }}): ModelBuilder {
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
      } else if (typeof item.copy === 'function') {
        tmpBuffer.length = channel.packed ? 1 : channel.elements
        item.copy(tmpBuffer)
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
      } else if (key.match('texture|uv|texcoord')) {
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
      Log.d(`[ModelBuilder] Mesh size reduced from ${this.vertexCount} to ${vCounter} vertices.`)
      this.vertices = newVertices
      this.vertexCount = vCounter

      this.indices = newIndices
      this.indexCount = iCounter
    }
  }

  /**
   * Creates new mesh options with current index and vertex buffer and saves them in the meshes array.
   * @param options
   */
  public endMeshOptions(options: ModelMeshOptions = {}): ModelMeshOptions {
    if (this.indexCount === 0 && this.vertexCount === 0) {
      Log.w(`[ModelBuilder] pushMesh : called on empty builder. ignore.`)
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

  public endMesh(device: Device, options: ModelMeshOptions = {}): ModelMesh {
    this.endMeshOptions(options)
    let opts = this.meshes[this.meshes.length - 1]
    return new ModelMesh(device, opts)
  }

  /**
   * Creates model options from the current builder state an resets the builder.
   * @param options The custom model options to be used. The 'meshes' option is ignored.
   * @returns {{materials: (Material[]|MaterialOptions[]|Array)}}
   */
  public endModelOptions(options: ModelOptions = {}): ModelOptions {
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
  public endModel(device: Device, options: ModelOptions = {}): Model {
    options = this.endModelOptions(options)
    return device.createModel(options)
  }

  public append(name: string, options?: any): ModelBuilder {
    let f = ModelBuilder.formulas[name]
    if (!f) {
      throw new Error(`[Graphics.Builder] formula not found '${name}'`)
    }
    if (typeof f !== 'function') {
      throw new Error(`[Graphics.Builder] formula '${name}' is not a function`)
    }
    f(this, options)
    return this
  }

  public static createMesh(device: Device, formula: string, formulaOptions?: any, meshOptions?: ModelMeshOptions): ModelMesh {
    return ModelBuilder.begin().append(formula, formulaOptions).endMesh(device, meshOptions)
  }

  public static createModel(device: Device, formula: string, formulaOptions?: any, modelOptions?: ModelOptions): Model {
    return ModelBuilder.begin().append(formula, formulaOptions).endModel(device, modelOptions)
  }
}
