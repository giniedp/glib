import { BoundingBox, BoundingSphere, Mat4 } from '@gglib/math'
import { Color } from '../Color'
import { Device } from '../Device'
import { FrontFace, PrimitiveType } from '../enums'
import {
  BufferOptions,
  PlainBufferData,
  vertexAttribute,
  VertexAttribute,
  vertexLayout,
  VertexLayout,
  VertexSemantic,
} from '../resources'
import { Geometry, GeometryOptions } from './Geometry'
import { GeometryUtil } from './GeometryUtil'

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
  defaults?: Partial<Record<VertexSemantic, number[]>>
  /**
   * The transform modes for each attribute
   */
  transformModes?: Record<VertexSemantic, TransformMode>
  /**
   * The vertex buffer layout
   */
  layout?: Array<VertexLayout | VertexSemantic[]>
}

export interface BuildGeometryOptions {
  /**
   * A name for the geometry
   */
  name?: string

  /**
   * The vertex buffer layout
   */
  vertexLayout?: Array<VertexLayout | VertexSemantic[]>

  /**
   * A transform matrix to apply to all vertices
   */
  vertexTransform?: Mat4

  /**
   * Default attribute values to use during the build process. If any vertex is pushed into the builder
   * with missing attributes they are resolved from here.
   */
  vertexDefaults?: Partial<Record<VertexSemantic, number[]>>

  /**
   * Primitive topology.  Defaults to `'TriangleList'`.
   */
  primitiveType?: PrimitiveType
}

/**
 * Convenience helper: creates a builder, runs `fn`, computes normals /
 * tangents / bounds, and uploads the result to the GPU in one call.
 */
export function buildGeometry<T>(
  device: Device,
  builder: GeometryBuilderFunction<T>,
  options?: T & BuildGeometryOptions,
): Geometry {
  const b = new GeometryBuilder({
    layout: options?.vertexLayout,
    defaults: options?.vertexDefaults,
  })
  if (options?.vertexTransform) {
    b.pushTransform(options.vertexTransform)
  }
  b.append(builder, options)
  b.calculateNormalsAndTangents()
  b.calculateBounds()
  return b.buildGeometry(device, {
    name: options?.name ?? 'geometry',
    primitiveType: options?.primitiveType,
  })
}

/**
 * A helper class for building 3d geometries
 *
 * @public
 */
export class GeometryBuilder {
  /**
   * Gets the indices in current state
   */
  public get indices(): ReadonlyArray<number> {
    return this.idxBuffer.data.elements
  }

  /**
   * The index count in current state
   */
  public get indexCount(): number {
    return this.idxBuffer.data.elements.length
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
  public defaults: Record<VertexSemantic, number[]>
  public transformModes: Record<VertexSemantic, TransformMode>

  public get indexBuffer() {
    return this.idxBuffer
  }

  public get vertexBuffer() {
    return this.vtxBuffer
  }

  private layout: VertexLayout[]
  private box: BoundingBox
  private sphere: BoundingSphere
  private idxBuffer: BufferOptions<PlainBufferData>
  private vtxBuffer: Array<BufferOptions<PlainBufferData>>
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
          return vertexLayout(it)
        } else {
          return it as VertexLayout
        }
      })
    } else {
      this.layout = [
        vertexLayout(['position', 'texture']),
        vertexLayout(['normal']),
        vertexLayout(['tangent', 'bitangent']),
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

  public pushTransform(transform: Mat4): this {
    const top = this.transformStack[this.transformStack.length - 1]
    this.transformStack.push(top ? Mat4.premultiply(transform, top) : transform.copy())
    return this
  }

  public popTransform(): this {
    this.transformStack.pop()
    return this
  }

  /**
   * Pushes and pops transform matrix to/from the stack around the given callback
   *
   * @param transform - the transform matrix
   * @param callback - the callback
   */
  public withTransform(transform: Mat4, callback: (builder: GeometryBuilder) => void): this {
    this.pushTransform(transform)
    callback(this)
    this.popTransform()
    return this
  }

  private resetData() {
    this.idxBuffer = {
      type: 'IndexBuffer',
      indexType: 'uint16',
      data: {
        type: 'uint16',
        elements: [],
      },
    }
    this.vtxBuffer = this.layout.map((l): BufferOptions<PlainBufferData> => {
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
    this.partUtil = new GeometryUtil(this.idxBuffer, this.vtxBuffer)
  }

  /**
   * Resets the builder state.
   *
   * @remarks
   * Any open state will be lost
   */
  public reset() {
    this.resetData()
    this.transformStack = []
    return this
  }

  /**
   * Pushes a single index into current state.
   */
  public addIndex(index: number): this {
    this.idxBuffer.data.elements.push(index)
    return this
  }

  /**
   * Pushes a single index into current state.
   */
  public addIndices(...index: number[]): this {
    this.idxBuffer.data.elements.push(...index)
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
        value.length = channel.elementCount
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

  public calculateBounds() {
    this.partUtil.calculateBounds()
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
   * Packages the current index and vertex buffers into a {@link GeometryOptions}
   * object and resets the working state for the next geometry.
   *
   * Returns `null` when there is no data to package.
   */
  public toGeometryOptions(
    options: {
      name?: string
      meta?: Record<string, any>
      primitiveType?: PrimitiveType
    } = {},
  ): GeometryOptions | null {
    if (this.indexCount === 0 || this.vertexCount === 0) {
      return null
    }

    this.upgradeIndexBufferIfNeeded()

    const baseName = options.name ?? 'geometry'
    const primitiveType = options.primitiveType ?? 'TriangleList'

    const indexBuffer = this.idxBuffer
    indexBuffer.name = `${baseName}_index`

    const vertexBuffer = this.vtxBuffer
    vertexBuffer.forEach((vb, i) => {
      vb.name = `${baseName}_vertex_${i}`
    })

    const result: GeometryOptions = {
      name: baseName,
      meta: options.meta || {},
      indexBuffer: indexBuffer,
      vertexBuffer: vertexBuffer,

      boundingBox: this.box,
      boundingSphere: this.sphere,
      primitiveType: primitiveType,
    }

    this.initBuffers()

    return result
  }

  /**
   * Creates a {@link Geometry} GPU resource from the current state.
   *
   * Calls {@link toGeometryOptions} internally; the options object is also
   * recorded in {@link geometries} for later mesh assembly.
   */
  public buildGeometry(
    device: Device,
    options: {
      name?: string
      primitiveType?: PrimitiveType
    },
  ): Geometry {
    const resolved = this.toGeometryOptions(options ?? {})
    if (!resolved) {
      throw new Error('buildGeometry: no vertices or indices in current state.')
    }
    return new Geometry(device, resolved)
  }

  /**
   * Initialises (or re-initialises) the working index and vertex buffers.
   */
  private initBuffers(): void {
    this.idxBuffer = {
      type: 'IndexBuffer',
      indexType: 'uint16',
      data: { type: 'uint16', elements: [] },
    }
    this.vtxBuffer = this.layout.map(
      (layout): BufferOptions<PlainBufferData> => ({
        vertexLayout: JSON.parse(JSON.stringify(layout)),
        type: 'VertexBuffer',
        data: { type: 'float32', elements: [] },
      }),
    )
    this.primitiveCount = 0
    this.box = new BoundingBox()
    this.sphere = new BoundingSphere()
    this.partUtil = new GeometryUtil(this.idxBuffer, this.vtxBuffer)
  }

  /**
   * Upgrades the index buffer to uint32 when the vertex count or alignment
   * requires it.
   */
  private upgradeIndexBufferIfNeeded(): void {
    const isUint16 = this.idxBuffer.data.type === 'uint16'
    const isAligned = !isUint16 || this.idxBuffer.data.elements.length % 2 === 0
    const exceedsUint16 = this.idxBuffer.data.elements.length >= 2 ** 16
    if (!isAligned || exceedsUint16) {
      this.idxBuffer.indexType = 'uint32'
      this.idxBuffer.data.type = 'uint32'
    }
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
