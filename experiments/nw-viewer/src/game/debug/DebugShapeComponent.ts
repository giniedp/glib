import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { Device, Geometry } from '@gglib/graphics'
import { mat4CreateFromRTS, vec4, type IVec3, type IVec4, type Mat4 } from '@gglib/math'

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

/**
 * Geometry of a custom debug shape. All entries with the same key share one geometry and are drawn instanced.
 */
export interface DebugShapeGeometry {
  key: string
  create: (device: Device, solid: boolean) => Geometry
}

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
}

export interface DebugShapeOptions {
  type: DebugShapeType
  /**
   * Required for the custom type
   */
  geometry?: DebugShapeGeometry
  layer?: DebugLayer

  translation?: IVec3
  rotation?: IVec4
  scale?: IVec3

  instances?: Array<Mat4>

  solid?: boolean
  color?: IVec3
  alpha?: number

  visibleIf?: () => boolean
}

export interface DebugShapeEntry {
  type: DebugShapeType
  geometry?: DebugShapeGeometry
  transforms: Mat4[]
  solid: boolean
  color: IVec4
  layer: DebugLayer
  visibleIf?: () => boolean
  boundsBox: boolean
  boundsSphere: boolean
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
  public entity: GameEntity
  public entries: DebugShapeEntry[] = []
  /**
   * Inspectable state and configuration of the owning entity, shown in the UI
   */
  public info: DebugInfoEntry[] = []

  /**
   * Layer union of all entries
   */
  public get layers() {
    if (this.layersUnion == null) {
      this.updateLayers()
    }
    return this.layersUnion
  }

  private layersUnion: number = null

  public constructor(options?: DebugShapeOptions) {
    if (options) {
      this.add(options)
    }
  }

  public add(options: DebugShapeOptions): DebugShapeEntry {
    const color = options?.color ?? { x: 1, y: 1, z: 1 }
    const entry: DebugShapeEntry = {
      color: vec4(color.x, color.y, color.z, options?.alpha ?? 1),
      solid: options?.solid ?? false,
      layer: options?.layer ?? DebugLayer.Selection,
      visibleIf: options?.visibleIf,
      type: options?.type ?? 'bounds-box',
      geometry: options?.geometry,
      boundsBox: options?.type === 'bounds-box',
      boundsSphere: options?.type === 'bounds-sphere',
      transforms: options.instances,
    }

    if (!entry.transforms) {
      const translation = options?.translation ?? { x: 0, y: 0, z: 0 }
      const rotation = options?.rotation ?? { x: 0, y: 0, z: 0, w: 1 }
      const scale = options?.scale ?? { x: 1, y: 1, z: 1 }
      entry.transforms = [mat4CreateFromRTS(rotation, translation, scale)]
    }
    this.entries.push(entry)
    this.layersUnion = null
    return entry
  }

  public addInfo(label: string, get: () => DebugInfoValue): this {
    this.info.push({ label, get })
    return this
  }

  private updateLayers() {
    let layers = 0
    for (const entry of this.entries) {
      layers |= entry.layer
    }
    this.layersUnion = layers
  }

  public initialize(): void {
    //
  }

  public destroy(): void {
    //
  }
}
