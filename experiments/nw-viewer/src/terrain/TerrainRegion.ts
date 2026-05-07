import { QuadTree as QTree, type ScheduledTask } from '@gglib/components'
import type { GameEntity } from '@gglib/ecs'
import type { Texture } from '@gglib/graphics'
import { Vec3, type IVec2 } from '@gglib/math'
import { brand, type Brand } from '@gglib/utils'
import { REGION_SIZE } from '../constants'
import type { TerrainTile } from './TerrainTileManager'

export type TerraPayload = {
  id: string // thie tile ID
  state: TerraQuadState
  lastSeen: number
  /**
   * visible in this frame
   */
  visible: boolean
  /**
   * required by a visible child
   */
  required: boolean

  region: TerrainRegion
  entity: GameEntity

  heightmap: Texture
  heightmapAncestor: TerraQuad
  heightmapTask: ScheduledTask

  tile: TerrainTile
  materialAncestor: TerraQuad
  materialRenderTask: ScheduledTask
}

export type TerraQuadState = Brand<number, 'TerraQuadState'>
export const TerraQuadState = {
  Unloaded: brand<TerraQuadState>(0),

  HeightLoading: brand<TerraQuadState>(1),
  HeightReady: brand<TerraQuadState>(2),

  MaterialStale: brand<TerraQuadState>(4),
  MaterialLoading: brand<TerraQuadState>(5),
  MaterialReady: brand<TerraQuadState>(6),

  Ready: brand<TerraQuadState>(7),
}

export type TerraQuad = QTree<TerraPayload>

export interface TerrainRegionOptions {
  origin: IVec2
  size: number
  leafSize: number
}

export class TerrainRegion {
  public get xIndex() {
    return this.origin.x / this.size
  }
  public get yIndex() {
    return this.origin.y / this.size
  }
  public readonly origin: IVec2
  public readonly size: number
  public readonly root: TerraQuad
  public readonly leafSize: number
  public readonly maxLevel: number
  public entity: GameEntity

  private requiredQuads = new Set<TerraQuad>()

  public constructor(options: TerrainRegionOptions) {
    this.size = options.size
    this.origin = options.origin
    this.leafSize = options.leafSize
    this.root = QTree.create({
      min: new Vec3(this.origin.x, 0, this.origin.y),
      max: new Vec3(this.origin.x + this.size, REGION_SIZE, this.origin.y + this.size),
      looseFactor: 1,
    })

    this.root.subdivideTosize(this.leafSize)
    this.maxLevel = Math.log2(this.size / this.leafSize)
  }

  public traverseRequiredSet(
    cameraX: number,
    cameraY: number,
    baseFactor: number,
    fn: (node: TerraQuad) => void,
  ): void {
    // clear helper collections
    this.requiredQuads.clear()
    clearVisibility(this.root)

    // list of non overlapping quads

    this.root.traverseLOD(cameraX, cameraY, baseFactor, (it) => {
      it.data.visible = true
      it.data.required = true

      // union with all ancestors
      let next = it
      while (next) {
        if (this.requiredQuads.has(next)) {
          // already tracked
          break
        }
        this.requiredQuads.add(next)
        next.data.required = true
        next = next.parent
      }
    })

    traverseRequired(this.root, fn)
  }
}

function clearVisibility(node: TerraQuad) {
  node.data.visible = false
  node.data.required = false
  for (const child of node.children) {
    clearVisibility(child)
  }
}

function traverseRequired(node: TerraQuad, fn: (node: TerraQuad) => void) {
  if (node.data.required) {
    fn(node)
  }
  for (const child of node.children) {
    traverseRequired(child, fn)
  }
}
