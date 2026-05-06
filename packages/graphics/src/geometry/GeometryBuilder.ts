import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { Color } from '../Color'
import { Device } from '../Device'
import { FrontFace } from '../enums'
import { BufferOptions, PlainBufferData } from '../resources'
import { AttributeSemantic, createVertexLayout, vertexAttribute, VertexAttribute, VertexLayout } from '../VertexLayout'
import { Geometry, GeometryOptions } from './Geometry'
import { GeometryUtil } from './GeometryUtil'
import { Mesh, MeshOptions } from './Mesh'

/**
 * A function that adds geometry into a given {@link GeometryBuilder}
 *
 * @public
 */
export type GeometryBuilderFunction<T = void> = (b: GeometryBuilder, options?: T) => void

export const enum TransformMode {
  None = 0,
  Position = 1,
  Normal = 2,
}

/**
 * Constructor options for {@link GeometryBuilder}
 *
 * @public
 */
export interface GeometryBuilderOptions {
  /**
   * Mapping of attribute name to its default value
   */
  defaults?: Record<AttributeSemantic, number[]>
  /**
   * The transform modes for each attribute
   */
  transformModes?: Record<AttributeSemantic, TransformMode>
  /**
   * The vertex buffer layout
   */
  layout?: Array<VertexLayout | AttributeSemantic[]>
}

export function beginGeometry(options?: GeometryBuilderOptions): GeometryBuilder {
  return new GeometryBuilder(options)
}

export function beginLineGeometry(): GeometryBuilder {
  return new GeometryBuilder({
    layout: [['position', 'color']],
  })
}

export interface BuildGeometryOptions {
  /**
   * A name for the geometry
   */
  name?: string
  /**
   * The geometry material id
   */
  materialId?: number
  /**
   * The vertex buffer layout
   */
  layout?: Array<VertexLayout | AttributeSemantic[]>
  /**
   * A transform matrix to apply to all vertices
   */
  transform?: Mat4
}

export function buildGeometry<T>(
  device: Device,
  builder: GeometryBuilderFunction<T>,
  options?: T & BuildGeometryOptions,
) {
  const b = beginGeometry({
    layout: options?.layout,
  })
  if (options?.transform) {
    b.beginTransform(options.transform)
  }
  b.append(builder, options)
  b.calculateNormalsAndTangents()
  b.calculateBoundings()
  return b.endGeometry(device, {
    name: options?.name || 'geometry',
    materialId: options?.materialId ?? 0,
  })
}

/**
 * A helper class for building 3d geometries
 *
 * @public
 */
export class GeometryBuilder {
  /**
   * Creates a new model builder
   *
   * @remarks simply calls the constructor with given options
   *
   * @param options - the constructor options
   */
  public static begin(options?: GeometryBuilderOptions): GeometryBuilder {
    return new GeometryBuilder(options)
  }

  /**
   * Gets the indices in current state
   */
  public get indices(): ReadonlyArray<number> {
    return this.indexBuffer.data.elements
  }

  /**
   * The index count in current state
   */
  public get indexCount(): number {
    return this.indexBuffer.data.elements.length
  }

  /**
   * The vertex count in current state
   */
  public get vertexCount(): number {
    return this.primitiveCount
  }

  /**
   * A map of default attributes
   *
   * @remarks
   * If {@link addVertex} is called with missing attributes, this is where
   * the default values are resolved from
   */
  public defaults: Record<AttributeSemantic, number[]>
  public transformModes: Record<AttributeSemantic, TransformMode>

  private layout: VertexLayout[]
  public geometries: GeometryOptions[] = []
  public meshes: MeshOptions[] = []

  private box: BoundingBox
  private sphere: BoundingSphere
  private indexBuffer: BufferOptions<PlainBufferData>
  private vertexBuffer: Array<BufferOptions<PlainBufferData>>
  private primitiveCount: number
  private partUtil: GeometryUtil

  private transformStack: Mat4[] = []
  private tmp: any[] = []

  /**
   * Creates a new instance of the ModelBuilder
   *
   * @param options
   */
  constructor(options: GeometryBuilderOptions = {}) {
    if (Array.isArray(options.layout) && options.layout.length > 0) {
      this.layout = options.layout.map((it) => {
        if (Array.isArray(it)) {
          return createVertexLayout(it)
        } else {
          return it as VertexLayout
        }
      })
    } else {
      this.layout = [
        createVertexLayout(['position', 'texture']),
        createVertexLayout(['normal']),
        createVertexLayout(['tangent', 'bitangent']),
      ]
    }

    // The fallback values that should be used during the build process.
    // If any vertex is pushed into the builder with missing attributes they are resolved from here.
    this.defaults = {
      position: [0, 0, 0],
      normal: [0, 1, 0],
      tangent: [1, 0, 0],
      bitangent: [0, 0, 1],
      color: [Color.packToRGBA(Color.Black)],
      texture: [0, 0],
      blendindices: [0, 0, 0, 0],
      blendweight: [0, 0, 0, 0],
      ...(options.defaults || {}),
    }

    this.transformModes = {
      position: TransformMode.Position,
      normal: TransformMode.Normal,
      tangent: TransformMode.Normal,
      bitangent: TransformMode.Normal,
      color: TransformMode.None,
      texture: TransformMode.None,
      blendindices: TransformMode.None,
      blendweight: TransformMode.None,
      ...(options.transformModes || {}),
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

  public pushTransform(transform: Mat4): this {
    this.beginTransform(transform)
    return this
  }

  public popTransform(): this {
    this.endTransform(this.transformStack.length - 1)
    return this
  }

  /**
   * Pops transform matrices from stack up until the given id
   *
   * @param id - the id that has been returned byt a call to `beginTransform`
   */
  public endTransform(id: number) {
    if (id < this.transformStack.length) {
      this.transformStack.length = id
    }
  }

  /**
   * Pushes and pops transform matrix to/from the stack around the given callback
   *
   * @param transform - the transform matrix
   * @param callback - the callback
   */
  public withTransform(transform: Mat4, callback: (builder: GeometryBuilder) => void): this {
    const id = this.beginTransform(transform)
    callback(this)
    this.endTransform(id)
    return this
  }

  private resetData() {
    this.indexBuffer = {
      type: 'IndexBuffer',
      indexType: 'uint16',
      data: {
        type: 'uint16',
        elements: [],
      },
    }
    this.vertexBuffer = this.layout.map((l): BufferOptions<PlainBufferData> => {
      return {
        vertexLayout: JSON.parse(JSON.stringify(l)),
        type: 'VertexBuffer',
        data: {
          type: 'float32', // TODO: this should be derived from the vertex layout
          elements: [],
        },
      }
    })

    this.primitiveCount = 0
    this.box = new BoundingBox()
    this.sphere = new BoundingSphere()
    this.partUtil = new GeometryUtil(this.indexBuffer, this.vertexBuffer, 'TriangleList')
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
    this.geometries.length = 0
    this.meshes.length = 0
    return this
  }

  /**
   * Pushes a single index into current state.
   */
  public addIndex(index: number): this {
    this.indexBuffer.data.elements.push(index)
    return this
  }

  /**
   * Pushes a single vertex definition into current state
   *
   * @remarks
   * The given vertex should contain all attributes for current layout. If any attribute is missing
   * a default value will be used: see {@link defaults}
   */
  public addVertex(
    vertex: Record<string, ReadonlyArray<number> | number | { toArray: (buf: number[]) => void }>,
  ): this {
    const transform = this.transformStack[this.transformStack.length - 1]
    const defaults = this.defaults
    const value = this.tmp

    for (const semantic of this.partUtil.channelNames) {
      const channel = this.partUtil.getChannel(semantic)
      let item = vertex[semantic] || defaults[semantic]

      if (Array.isArray(item)) {
        // ok
      } else if (typeof item === 'number') {
        value.length = 1
        value[0] = item
        item = value
      } else if ('toArray' in item && typeof item.toArray === 'function') {
        value.length = channel.elements
        item.toArray(value)
        item = value
      } else {
        throw new Error(
          `vertex attribute must be either a "number" or "number[]" or have "toArray" method. type was '${typeof item}'`,
        )
      }

      if (transform) {
        const mode = this.transformModes[semantic]
        if (mode == TransformMode.Position) {
          transform.transformV3Array(item)
        }
        if (mode == TransformMode.Normal) {
          transform.transformV3NormalArray(item)
        }
      }

      channel.writeAttribute(this.primitiveCount, item)
    }

    this.primitiveCount += 1
    return this
  }

  public readVertex(index: number, channels = this.partUtil.channelNames): { [k: string]: number[] } {
    const result: any = {}
    channels.map((semantic) => {
      result[semantic] = this.partUtil.getChannel(semantic).readAttribute(index, result[semantic] || [])
    })
    return result
  }

  public calculateBoundings() {
    this.partUtil.calculateBoundings()
    this.box.initFrom(this.partUtil.boundingBox)
    this.sphere.initFrom(this.partUtil.boundingSphere)
    return this
  }

  public calculateNormals(options?: { create?: boolean; update?: boolean; frontFace?: FrontFace }): this {
    this.partUtil.calculateNormals(options)
    return this
  }

  public calculateTangents(options?: { create?: boolean; update?: boolean; frontFace?: FrontFace }): this {
    this.partUtil.calculateTangents(options)
    return this
  }

  public calculateNormalsAndTangents(options?: { create?: boolean; update?: boolean; frontFace?: FrontFace }): this {
    this.partUtil.calculateNormalsAndTangents(options)
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
  public ensureLayoutChannel(name: string, channel: VertexAttribute = vertexAttribute(name)) {
    if (this.partUtil.hasChannel(name)) {
      return
    }
    if (!channel) {
      throw new Error(`preset for '${name}' is missing`)
    }
    this.partUtil.createChannel(name, channel)
  }

  /**
   * Same as {@link endGeometry} but returns the builder for chaining
   *
   * @param options - options for `endMeshPart`
   */
  public closeGeometry(options?: GeometryOptions): this {
    this.endGeometry(options)
    return this
  }

  /**
   * Creates new {@link GeometryOptions} with current index and vertex buffer and saves them in the geometries array.
   *
   * @param options - options to start with
   * @returns GeometryOptions or null if current state has no mesh part data
   */
  public endGeometry(options?: GeometryOptions): GeometryOptions | null
  /**
   * Creates new mesh with current index and vertex buffer and saves them in the geometries array.
   *
   * @param device - the graphics device
   * @param options - options to start with
   * @returns Geometry or null if current state has no mesh part data
   */
  public endGeometry(device: Device, options?: GeometryOptions): Geometry
  public endGeometry(): Geometry | GeometryOptions {
    if (this.indexCount === 0 || this.vertexCount === 0) {
      return null
    }

    let device: Device
    let options: GeometryOptions
    let result: GeometryOptions | Geometry
    if (arguments[0] instanceof Device) {
      device = arguments[0]
      options = arguments[1] || {}
      result = null
    } else {
      device = null
      options = arguments[0] || {}
      result = options
    }

    const isUint16 = this.indexBuffer.data.type === 'uint16'
    const isAligned = !isUint16 || this.indexBuffer.data.elements.length % 2 === 0
    const needsUint32 = !isAligned || this.indexBuffer.data.elements.length >= Math.pow(2, 16)
    if (needsUint32) {
      this.indexBuffer.indexType = 'uint32'
      this.indexBuffer.data.type = 'uint32'
    }
    options.materialId = options.materialId || 0
    options.indexBuffer = this.indexBuffer
    options.vertexBuffer = this.vertexBuffer
    options.boundingBox = this.box
    options.boundingSphere = this.sphere

    options.indexBuffer.name = `${options.name || 'geometry'}_index`
    options.vertexBuffer.forEach((vb, i) => {
      vb.name = `${options.name || 'geometry'}_vertex_${i}`
    })

    this.geometries.push(options)
    this.resetData()

    if (device) {
      result = new Geometry(device, options)
    }

    return result
  }

  /**
   * Same as {@link endMesh} but returns the builder for chaining
   *
   * @param options - options for `endMesh`
   */
  public closeMesh(options?: MeshOptions): this {
    this.endMesh(options)
    return this
  }

  /**
   * From current state it creates {@link MeshOptions} and prepares the builder for the next mesh
   *
   * @param options - Additional {@link MeshOptions} . The {@link MeshOptions.parts} option is ignored.
   * @returns `ModelMeshOptions` or `null` if current state has no mesh data
   */
  public endMesh(options?: MeshOptions): MeshOptions
  /**
   * From current state it creates in instance of {@link Mesh} and prepares the builder for the next mesh
   *
   * @param device - The graphics device
   * @param options - Additional {@link MeshOptions} . The {@link MeshOptions.parts} option is ignored.
   * @returns `ModelMesh` or `null` if current state has no mesh data
   */
  public endMesh(device: Device, options?: MeshOptions): Mesh
  public endMesh(): Mesh | MeshOptions {
    this.endGeometry()
    if (!this.geometries.length) {
      return null
    }

    let device: Device
    let options: MeshOptions
    let result: MeshOptions | Mesh
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
    options.parts = this.geometries

    if (!options.boundingBox && this.geometries.every((mesh) => !!mesh.boundingBox)) {
      options.boundingBox = this.geometries.reduce((box, mesh) => {
        const meshBox = BoundingBox.convert(mesh.boundingBox)
        return box ? box.merge(meshBox) : BoundingBox.createFrom(meshBox)
      }, null as BoundingBox)
    }
    if (!options.boundingSphere && options.boundingBox) {
      options.boundingSphere = BoundingSphere.createFromBox(BoundingBox.convert(options.boundingBox)).toArray()
    }

    this.meshes.push(options)
    this.geometries = []
    this.resetData()

    if (device) {
      result = new Mesh(device, options)
    }

    return result
  }

  /**
   * Calls the given builder function to add geometry to current state
   *
   * @param builder - The builder function to call
   * @param options - The builder options to use
   */
  public append<T>(builder: GeometryBuilderFunction<T>, options?: T) {
    builder(this, options)
    return this
  }
}
