import type { GameComponent, GameEntity } from '@gglib/ecs'
import { type Mat4, mat4CreateFromRTS, vec4, type IVec3, type IVec4 } from '@gglib/math'

export type DebugShapeType = 'bounds-box' | 'bounds-sphere' | 'box' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'disc'

export type DebugLayer = number
export const DebugLayer = {
  Selection: 1 << 0,
  BoundsImpostor: 1 << 1,
  BoundsMesh: 1 << 2,
  BoundsMeshInstance: 1 << 3,
  Slice: 1 << 4,
  SliceSpawn: 1 << 5,
  LightPoint: 1 << 6,
  LightSpot: 1 << 7,
  LightArea: 1 << 8,
  LightProbe: 1 << 9,
  TimeOfDay: 1 << 10,
}

export interface DebugShapeOptions {
  type: DebugShapeType
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
  transforms: Mat4[]
  solid: boolean
  color: IVec4
  layer: DebugLayer
  visibleIf?: () => boolean
  boundsBox: boolean
  boundsSphere: boolean
}

export class DebugShapeComponent implements GameComponent {
  public entity: GameEntity
  public entries: DebugShapeEntry[] = []

  // public type: DebugShapeType
  // public localTransforms: Mat4[]

  // public solid: boolean
  // public color: IVec4

  // public layer: DebugLayer
  // public visibleIf?: () => boolean

  // public readonly boundsBox: boolean
  // public readonly boundsSphere: boolean

  public constructor(options?: DebugShapeOptions) {
    if (options) {
      this.add(options)
    }
    // if (options?.instances?.length) {
    //   this.localTransforms = options.instances
    // } else {
    //   const translation = options?.translation ?? { x: 0, y: 0, z: 0 }
    //   const rotation = options?.rotation ?? { x: 0, y: 0, z: 0, w: 1 }
    //   const scale = options?.scale ?? { x: 1, y: 1, z: 1 }
    //   this.localTransforms = [mat4CreateFromRTS(rotation, translation, scale)]
    // }

    // const color = options?.color ?? { x: 1, y: 1, z: 1 }
    // this.color = vec4(color.x, color.y, color.z, options?.alpha ?? 1)
    // this.solid = options?.solid ?? false
    // this.layer = options?.layer ?? DebugLayer.Selection

    // this.visibleIf = options?.visibleIf

    // this.type = options?.type ?? 'bounds-box'
    // this.boundsBox = this.type === 'bounds-box'
    // this.boundsSphere = this.type === 'bounds-sphere'
  }

  public add(options: DebugShapeOptions): DebugShapeEntry {
    const color = options?.color ?? { x: 1, y: 1, z: 1 }
    const entry: DebugShapeEntry = {
      color: vec4(color.x, color.y, color.z, options?.alpha ?? 1),
      solid: options?.solid ?? false,
      layer: options?.layer ?? DebugLayer.Selection,
      visibleIf: options?.visibleIf,
      type: options?.type ?? 'bounds-box',
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
    return entry
  }

  public initialize(): void {
    //
  }

  public destroy(): void {
    //
  }
}
