import {
  bufferField,
  bufferLayout,
  bufferRecorder,
  BufferRecorder,
  Device,
  Geometry,
  Mesh,
  type Ownable,
  ResourceOwnership,
  VertexBuffer,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere, type IVec4, type Mat4 } from '@gglib/math'
import { SpriteMaterial } from './SpriteMaterial'

/**
 * Constructor options for {@link SpriteMesh}
 *
 * @public
 */
export interface SpriteMeshOptions {
  /**
   * Initial number of quads. The buffer grows as needed. Defaults to `64`
   */
  capacity?: number
}

/**
 * A mesh that draws textured quads in world space with a single instanced draw call
 *
 * @public
 * @remarks
 * Call {@link begin}, write the quads with {@link writeQuad} and {@link commit} them before the {@link mesh} is rendered.
 * All quads share the texture of the {@link material}.
 */
export class SpriteMesh implements Ownable {
  /**
   * The ownership state of this mesh
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * The instanced vertex buffer holding one record per quad
   */
  public readonly vertexBuffer: VertexBuffer

  /**
   * The geometry drawing all quads, its instance count is updated by {@link commit}
   */
  public readonly geometry: Geometry

  /**
   * The sprite material
   */
  public readonly material: SpriteMaterial

  /**
   * A mesh with the {@link geometry} and the {@link material}, to be rendered by a scene
   */
  public readonly mesh: Mesh

  /**
   * Number of quads written since {@link begin}
   */
  public get count() {
    return this.writer.count
  }

  private writer: BufferRecorder
  private layout = bufferLayout([
    bufferField('origin', 'vec3f'),
    bufferField('axisX', 'vec3f'),
    bufferField('axisY', 'vec3f'),
    bufferField('texcoord', 'vec4f'),
    bufferField('color', 'vec4f'),
  ])

  public constructor(device: Device, options?: SpriteMeshOptions) {
    const capacity = options?.capacity ?? 64
    this.writer = bufferRecorder({
      capacity,
      autosize: true,
      recordByteSize: this.layout.byteSize,
    })
    this.vertexBuffer = this.ownership.adopt(
      device.createVertexBuffer([
        {
          layout: this.layout.vertex,
          instanced: true,
          stride: this.layout.byteSize,
          size: this.layout.byteSize * capacity,
        },
      ]),
    )
    this.material = this.ownership.adopt(new SpriteMaterial(device, { properties: {} }))
    this.geometry = new Geometry(device, {
      name: 'Sprites',
      primitiveType: 'triangle-strip',
      vertexBuffer: this.vertexBuffer,
      vertexCount: 4,
      instanceCount: 0,
    })
    // sprites are placed freely in world space, the bounds must not cull them
    this.mesh = this.ownership.adopt(
      new Mesh(device, {
        name: 'Sprites',
        geometries: [this.geometry],
        materials: [this.material],
        parts: [{ geometryIndex: 0, materialIndex: 0 }],
        boundingBox: new BoundingBox(-1e6, -1e6, -1e6, 1e6, 1e6, 1e6),
        boundingSphere: new BoundingSphere(0, 0, 0, 1e6),
      }),
    )
  }

  /**
   * Removes all quads
   */
  public begin(): this {
    this.writer.reset()
    return this
  }

  /**
   * Adds a quad given as a rectangle in the local XY plane of the `world` matrix
   *
   * @param world - the transform of the quad
   * @param x0 - local x of the corner with texcoord `u0`
   * @param y0 - local y of the corner with texcoord `v0`
   * @param x1 - local x of the corner with texcoord `u1`
   * @param y1 - local y of the corner with texcoord `v1`
   * @param color - tint color
   */
  public writeQuad(
    world: Mat4,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    color: IVec4,
  ): this {
    const m = world
    const dx = x1 - x0
    const dy = y1 - y0
    this.writer
      .seek(this.writer.count)
      .writeFloat32x3(
        m[12] + m[0] * x0 + m[4] * y0,
        m[13] + m[1] * x0 + m[5] * y0,
        m[14] + m[2] * x0 + m[6] * y0,
      )
      .writeFloat32x3(m[0] * dx, m[1] * dx, m[2] * dx)
      .writeFloat32x3(m[4] * dy, m[5] * dy, m[6] * dy)
      .writeFloat32x4(u0, v0, u1, v1)
      .writeFloat32x4(color.x, color.y, color.z, color.w)
    return this
  }

  /**
   * Uploads the quads and updates the instance count of the {@link geometry}
   */
  public commit(): this {
    if (this.writer.count > 0) {
      this.writer.upload(this.vertexBuffer.buffers[0])
    }
    this.geometry.instanceCount = this.writer.count
    return this
  }

  /**
   * Immediately finalizes this mesh, its vertex buffer and material
   */
  public dispose() {
    this.ownership.finalize()
  }
}
