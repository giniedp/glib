import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { Device, Geometry } from '@gglib/graphics'
import { mat4CreateFromRTS, vec4, type IVec3, type IVec4, type Mat4 } from '@gglib/math'
import { append, eventType, removeItemUnordered } from '@gglib/utils'
import { getDebugMeshBuilder } from './DebugMesh'

export type DebugShapeType =
  | 'bounds-box'
  | 'bounds-sphere'
  | 'box'
  | 'sphere'
  | 'plane'
  | 'cylinder'
  | 'cone'
  | 'disc'
  | 'custom'

export type DebugLayer = number
export const DebugLayer = {
  Selection: 1 << 0,
  Impostor_VEG: 1 << 1,
  Impostor_POI: 1 << 2,
  Mesh: 1 << 3,
  MeshInstance: 1 << 4,
  Slice: 1 << 5,
  SliceSpawn: 1 << 6,
  LightPoint: 1 << 7,
  LightSpot: 1 << 8,
  LightArea: 1 << 9,
  LightProbe: 1 << 10,
  TimeOfDay: 1 << 11,
  Collision: 1 << 12,
  CollisionVolume: 1 << 13,
  TerrainPages: 1 << 14,
  Roads: 1 << 15,
}

export interface DebugShapeOptions {
  /**
   * The debug layer where this shape is assigned to
   */
  layer: DebugLayer
  /**
   * The shape type to render
   */
  type: DebugShapeType
  /**
   * Custom shape key. Defaults to `${type}:${solid}` if missing.
   *
   * @remarks
   * A custom geometry should provide an own key
   */
  key?: string
  /**
   * Required for the custom type
   */
  geometry?: (device: Device, solid: boolean) => Geometry

  translation?: IVec3
  rotation?: IVec4
  scale?: IVec3
  instances?: Array<Mat4>

  /**
   *
   */
  solid?: boolean
  /**
   * The instance color
   */
  color?: IVec3
  /**
   * The instance transparency
   */
  alpha?: number

  visibleIf?: () => boolean
}

let shapeEntryIds = 0
export interface DebugShapeEntry {
  readonly id: number
  readonly key: string
  readonly type: DebugShapeType
  readonly geometry: (device: Device, solid: boolean) => Geometry
  readonly solid: boolean
  readonly color: IVec4
  readonly layer: DebugLayer
  readonly visibleIf?: () => boolean
  readonly boundsBox: boolean
  readonly boundsSphere: boolean
  readonly entity: GameEntity
  transforms: Mat4[]
}

export type DebugInfoValue = string | number | boolean | null | undefined

export interface DebugInfoEntry {
  label: string
  /**
   * Called lazily by the UI, may compute current state
   */
  get: () => DebugInfoValue
}

export class DebugShapeComponent implements GameComponent {
  public static onShapeAdded = eventType<DebugShapeEntry>(Symbol('DebugShapeAdded'))
  public static onShapeRemoved = eventType<DebugShapeEntry>(Symbol('DebugShapeRemoved'))

  /**
   *
   */
  public readonly entity: GameEntity

  /**
   *
   */
  public readonly entries: ReadonlyArray<DebugShapeEntry> = []

  /**
   * Inspectable state and configuration of the owning entity, shown in the UI
   */
  public info: DebugInfoEntry[] = []

  public constructor(options?: DebugShapeOptions) {
    if (options) {
      this.add(options)
    }
  }

  public add(options: DebugShapeOptions): DebugShapeEntry {
    console.assert(!!options.layer, `layer option must be set`)
    console.assert(!!options.type, `type option must be set`)
    if (options.type === 'custom') {
      console.assert(!!options.key, `key option must be set for custom shapes`)
      console.assert(!!options.geometry, `geometry option must be set for custom shapes`)
    }

    const color = options.color ?? { x: 1, y: 1, z: 1 }
    const type = options.type
    const component = this
    const entry: DebugShapeEntry = {
      id: shapeEntryIds++,
      get entity() {
        return component.entity
      },
      color: vec4(color.x, color.y, color.z, options?.alpha ?? 1),
      solid: options.solid ?? false,
      layer: options.layer ?? DebugLayer.Selection,
      visibleIf: options.visibleIf,
      key: options.key ?? `${options.type}:${options.solid}`,
      type: options.type ?? 'bounds-box',
      geometry: options.geometry || getDebugMeshBuilder(type),
      boundsBox: options.type === 'bounds-box',
      boundsSphere: options.type === 'bounds-sphere',
      transforms: options.instances,
    }

    if (!entry.transforms) {
      const translation = options?.translation ?? { x: 0, y: 0, z: 0 }
      const rotation = options?.rotation ?? { x: 0, y: 0, z: 0, w: 1 }
      const scale = options?.scale ?? { x: 1, y: 1, z: 1 }
      entry.transforms = [mat4CreateFromRTS(rotation, translation, scale)]
    }

    append(this.entries as DebugShapeEntry[], entry)
    if (this.entity) {
      this.entity.events.emit(DebugShapeComponent.onShapeAdded, entry)
    }
    return entry
  }

  public remove(entry: DebugShapeEntry) {
    removeItemUnordered(this.entries as any, entry)
    if (this.entity) {
      this.entity.events.emit(DebugShapeComponent.onShapeRemoved, entry)
    }
  }

  public addInfo(label: string, get: () => DebugInfoValue): this {
    this.info.push({ label, get })
    return this
  }

  public initialize(): void {
    //
  }

  public destroy(): void {
    //
  }
}
