import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { DebugLineMaterial } from '@gglib/effects'
import { GameLoop } from '@gglib/game'
import { Color, Device, FALSE, Geometry, Mesh, TRUE, vertexLayout } from '@gglib/graphics'
import {
  BoundingBox,
  BoundingCylinder,
  BoundingOrientedBox,
  BoundingSphere,
  IRay,
  IVec3,
  IVec4,
  Mat4,
  vec3,
} from '@gglib/math'
import { MeshComponent } from '../components/MeshComponent'
import type { SceneComponent } from '../components/SceneComponent'
import { TransformComponent } from '../components/TransformComponent'
import { EcsGame } from './EcsGame'

/**
 * Volumes that can be drawn with {@link DebugDrawSystem.volume}
 *
 * @public
 */
export type DebugDrawVolume = BoundingBox | BoundingSphere | BoundingOrientedBox | BoundingCylinder

/**
 * Constructor options for {@link DebugDrawSystem}
 *
 * @public
 */
export interface DebugDrawSystemOptions {
  /**
   * If `false`, the lines are drawn on top of everything. Defaults to `true`
   */
  depthTest?: boolean
  /**
   * The scene to render into. Defaults to the scene of the {@link EcsGame}
   */
  scene?: SceneComponent
}

// position (3 x float32) + color (packed rgba8)
const FLOATS_PER_VERTEX = 4
const layout = vertexLayout(['position', 'color'])

const p0 = vec3()
const p1 = vec3()
const p2 = vec3()
const u = vec3()
const v = vec3()
const corners: IVec3[] = Array.from({ length: 8 }, () => vec3())

/**
 * Draws debug lines and shapes in immediate mode
 *
 * @public
 * @remarks
 * Shapes are given in world space and drawn as lines. Call the draw methods every update, the lines are
 * cleared at the start of each update tick of the {@link GameLoop}. Without a game loop, call {@link clear} manually.
 *
 * All lines are collected into a single vertex buffer and rendered with one draw call.
 * Drawing does not allocate memory, except when the buffer needs to grow.
 *
 * @example
 * ```ts
 * const debug = world.getSystem(DebugDrawSystem)
 * debug.line(a, b, Color.Red)
 * debug.volume(collider.volume, Color.Lime)
 * ```
 */
export class DebugDrawSystem extends GameSystem {
  /**
   * Draw calls are ignored and nothing is rendered while disabled
   */
  public enabled = true

  /**
   * Number of line segments of circles
   */
  public segments = 24

  /**
   * Number of vertices drawn in the current frame
   */
  public get vertexCount() {
    return this.count
  }

  private world: GameWorld
  private loop: GameLoop | null = null
  private options: DebugDrawSystemOptions
  private capacity = 1024
  private data = new ArrayBuffer(this.capacity * FLOATS_PER_VERTEX * 4)
  private f32 = new Float32Array(this.data)
  private u32 = new Uint32Array(this.data)
  private count = 0
  private grown = false
  private entity: GameEntity | null = null
  private geometry: Geometry | null = null

  public constructor(options?: DebugDrawSystemOptions) {
    super()
    this.options = options ?? {}
  }

  public override initialize(world: GameWorld): void {
    this.world = world
    // registered before the game update handler, so lines drawn during the update survive until the next update
    this.loop = world.getSystem(GameLoop, { optional: true })
    this.loop?.onUpdate.add(this.clear)
  }

  public override destroy(): void {
    this.loop?.onUpdate.remove(this.clear)
    this.entity?.destroy()
    this.entity = null
    this.geometry = null
  }

  /**
   * Removes all lines
   */
  public clear = () => {
    this.count = 0
  }

  public override render(): void {
    if (!this.geometry) {
      this.createEntity()
      if (!this.geometry) {
        return
      }
    }
    const count = this.enabled ? this.count : 0
    const buffer = this.geometry.vertexBuffer.buffers[0]
    if (this.grown) {
      this.grown = false
      buffer.setData(this.data)
    } else if (count > 0) {
      buffer.setSubData(0, this.f32, 0, count * FLOATS_PER_VERTEX)
    }
    this.geometry.vertexCount = count
  }

  /**
   * Draws a line
   */
  public line(a: IVec3, b: IVec3, color: IVec4 = Color.White) {
    if (!this.enabled) {
      return
    }
    const packed = Color.packToRGBA(color)
    this.vertex(a.x, a.y, a.z, packed)
    this.vertex(b.x, b.y, b.z, packed)
  }

  /**
   * Draws a ray up to the given length
   */
  public ray(ray: IRay, length: number, color: IVec4 = Color.White) {
    const o = ray.position
    const d = ray.direction
    p0.x = o.x + d.x * length
    p0.y = o.y + d.y * length
    p0.z = o.z + d.z * length
    this.line(o, p0, color)
  }

  /**
   * Draws a small cross at the given point
   */
  public point(point: IVec3, size = 0.1, color: IVec4 = Color.White) {
    for (let axis = 0; axis < 3; axis++) {
      p0.x = point.x - (axis === 0 ? size : 0)
      p0.y = point.y - (axis === 1 ? size : 0)
      p0.z = point.z - (axis === 2 ? size : 0)
      p1.x = point.x + (axis === 0 ? size : 0)
      p1.y = point.y + (axis === 1 ? size : 0)
      p1.z = point.z + (axis === 2 ? size : 0)
      this.line(p0, p1, color)
    }
  }

  /**
   * Draws the x (red), y (green) and z (blue) axes of a transform
   */
  public axes(transform: Mat4, size = 1) {
    p0.x = transform[12]
    p0.y = transform[13]
    p0.z = transform[14]
    for (let axis = 0; axis < 3; axis++) {
      p1.x = p0.x + transform[axis * 4 + 0] * size
      p1.y = p0.y + transform[axis * 4 + 1] * size
      p1.z = p0.z + transform[axis * 4 + 2] * size
      this.line(p0, p1, axis === 0 ? Color.Red : axis === 1 ? Color.Lime : Color.Blue)
    }
  }

  /**
   * Draws a circle in the plane spanned by the unit vectors `axisU` and `axisV`
   */
  public circle(center: IVec3, axisU: IVec3, axisV: IVec3, radius: number, color: IVec4 = Color.White) {
    if (!this.enabled) {
      return
    }
    const packed = Color.packToRGBA(color)
    const segments = this.segments
    let prevX = center.x + axisU.x * radius
    let prevY = center.y + axisU.y * radius
    let prevZ = center.z + axisU.z * radius
    for (let i = 1; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const c = Math.cos(angle) * radius
      const s = Math.sin(angle) * radius
      const x = center.x + axisU.x * c + axisV.x * s
      const y = center.y + axisU.y * c + axisV.y * s
      const z = center.z + axisU.z * c + axisV.z * s
      this.vertex(prevX, prevY, prevZ, packed)
      this.vertex(x, y, z, packed)
      prevX = x
      prevY = y
      prevZ = z
    }
  }

  /**
   * Draws an axis aligned box
   */
  public box(box: BoundingBox, color: IVec4 = Color.White) {
    const { min, max } = box
    for (let i = 0; i < 8; i++) {
      corners[i].x = i & 1 ? max.x : min.x
      corners[i].y = i & 2 ? max.y : min.y
      corners[i].z = i & 4 ? max.z : min.z
    }
    this.boxEdges(color)
  }

  /**
   * Draws an oriented box
   */
  public orientedBox(box: BoundingOrientedBox, color: IVec4 = Color.White) {
    const { center: c, halfExtents: h, axisX: x, axisY: y, axisZ: z } = box
    for (let i = 0; i < 8; i++) {
      const sx = i & 1 ? h.x : -h.x
      const sy = i & 2 ? h.y : -h.y
      const sz = i & 4 ? h.z : -h.z
      corners[i].x = c.x + x.x * sx + y.x * sy + z.x * sz
      corners[i].y = c.y + x.y * sx + y.y * sy + z.y * sz
      corners[i].z = c.z + x.z * sx + y.z * sy + z.z * sz
    }
    this.boxEdges(color)
  }

  /**
   * Draws a sphere as three circles
   */
  public sphere(sphere: BoundingSphere, color: IVec4 = Color.White) {
    const { center, radius } = sphere
    this.circle(center, unit(u, 1, 0, 0), unit(v, 0, 1, 0), radius, color)
    this.circle(center, unit(u, 0, 1, 0), unit(v, 0, 0, 1), radius, color)
    this.circle(center, unit(u, 0, 0, 1), unit(v, 1, 0, 0), radius, color)
  }

  /**
   * Draws a cylinder as two cap circles and four lines along the side
   */
  public cylinder(cylinder: BoundingCylinder, color: IVec4 = Color.White) {
    const { center: c, axis: a, radius: r, halfHeight: h } = cylinder
    perpendicular(a, u)
    // v = a x u
    v.x = a.y * u.z - a.z * u.y
    v.y = a.z * u.x - a.x * u.z
    v.z = a.x * u.y - a.y * u.x

    p0.x = c.x - a.x * h
    p0.y = c.y - a.y * h
    p0.z = c.z - a.z * h
    p1.x = c.x + a.x * h
    p1.y = c.y + a.y * h
    p1.z = c.z + a.z * h
    this.circle(p0, u, v, r, color)
    this.circle(p1, u, v, r, color)

    for (let i = 0; i < 4; i++) {
      const su = i === 0 ? r : i === 2 ? -r : 0
      const sv = i === 1 ? r : i === 3 ? -r : 0
      p2.x = p0.x + u.x * su + v.x * sv
      p2.y = p0.y + u.y * su + v.y * sv
      p2.z = p0.z + u.z * su + v.z * sv
      corners[0].x = p1.x + u.x * su + v.x * sv
      corners[0].y = p1.y + u.y * su + v.y * sv
      corners[0].z = p1.z + u.z * su + v.z * sv
      this.line(p2, corners[0], color)
    }
  }

  /**
   * Draws any of the supported bounding volumes
   */
  public volume(volume: DebugDrawVolume, color: IVec4 = Color.White) {
    if (volume instanceof BoundingSphere) {
      this.sphere(volume, color)
    } else if (volume instanceof BoundingOrientedBox) {
      this.orientedBox(volume, color)
    } else if (volume instanceof BoundingCylinder) {
      this.cylinder(volume, color)
    } else if (volume instanceof BoundingBox) {
      this.box(volume, color)
    }
  }

  private boxEdges(color: IVec4) {
    // corner index bits: 1 = x, 2 = y, 4 = z. An edge connects corners that differ in one bit
    for (let i = 0; i < 8; i++) {
      for (let bit = 1; bit < 8; bit <<= 1) {
        if (!(i & bit)) {
          this.line(corners[i], corners[i | bit], color)
        }
      }
    }
  }

  private vertex(x: number, y: number, z: number, color: number) {
    if (this.count >= this.capacity) {
      this.grow()
    }
    const offset = this.count * FLOATS_PER_VERTEX
    this.f32[offset] = x
    this.f32[offset + 1] = y
    this.f32[offset + 2] = z
    this.u32[offset + 3] = color
    this.count++
  }

  private grow() {
    this.capacity *= 2
    const data = new ArrayBuffer(this.capacity * FLOATS_PER_VERTEX * 4)
    new Uint8Array(data).set(new Uint8Array(this.data))
    this.data = data
    this.f32 = new Float32Array(data)
    this.u32 = new Uint32Array(data)
    this.grown = true
  }

  private createEntity() {
    const scene = this.options.scene ?? this.world.getSystem(EcsGame, { optional: true })?.scene
    if (!scene) {
      return
    }
    const device = this.world.getSystem(Device)
    const geometry = new Geometry(device, {
      name: 'Debug Lines',
      primitiveType: 'line-list',
      vertexBuffer: [{ layout, data: this.data }],
      vertexCount: 0,
    })
    const material = new DebugLineMaterial(device, {
      properties: {
        depthTest: (this.options.depthTest ?? true) as any, // TODO: typesystem
      },
    })
    const mesh = new Mesh(device, {
      name: 'Debug Lines',
      geometries: [geometry],
      materials: [material],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
      boundingBox: new BoundingBox(-1, -1, -1, 1, 1, 1),
      boundingSphere: new BoundingSphere(0, 0, 0, 1),
    })
    this.geometry = geometry
    this.grown = false
    this.entity = this.world.createEntity({
      name: 'Debug Lines',
      parent: scene.entity,
      transform: new TransformComponent(),
      components: [new MeshComponent({ mesh })],
    })
  }
}

function unit(out: IVec3, x: number, y: number, z: number) {
  out.x = x
  out.y = y
  out.z = z
  return out
}

/**
 * Writes a unit vector perpendicular to the given unit vector
 */
function perpendicular(a: IVec3, out: IVec3) {
  // cross with the coordinate axis that is least aligned with a
  if (Math.abs(a.x) < 0.9) {
    // a x (1, 0, 0)
    out.x = 0
    out.y = a.z
    out.z = -a.y
  } else {
    // a x (0, 1, 0)
    out.x = -a.z
    out.y = 0
    out.z = a.x
  }
  const length = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z)
  out.x /= length
  out.y /= length
  out.z /= length
}
