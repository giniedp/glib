import { QuadTree, QuadTreeNode, type ScheduledTask } from '@gglib/components'
import type { GameEntity } from '@gglib/ecs'
import { BoundingFrustum, Vec3, type IVec2 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { brand, type Brand } from '@gglib/utils'
import type { TerrainTile } from './TerrainTileManager'

export type TerraPayload = {
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

  tile: TerrainTile
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

export type TerraRoot = QuadTree<TerraPayload>
export type TerraQuad = QuadTreeNode<TerraPayload>

export interface TerrainRegionOptions {
  name: string
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

  public readonly name: string
  public readonly origin: IVec2
  public readonly size: number
  public readonly tree: TerraRoot
  public readonly leafSize: number
  public readonly maxLevel: number
  public entity: GameEntity

  private frustum: BoundingFrustum = new BoundingFrustum()
  private requiredQuads = new Set<TerraQuad>()

  public constructor(options: TerrainRegionOptions) {
    this.name = options.name
    this.size = options.size
    this.origin = options.origin
    this.leafSize = options.leafSize
    this.tree = QuadTree.create({
      min: new Vec3(this.origin.x, this.origin.y, 0),
      max: new Vec3(this.origin.x + this.size, this.origin.y + this.size, this.size),
      verticalAxis: 'z',
    })

    this.tree.subdivideTosize(this.leafSize)
    this.maxLevel = Math.log2(this.size / this.leafSize)
  }

  public traverseRequiredSet(camera: CameraData, baseFactor: number, fn: (node: TerraQuad) => void): void {
    // clear helper collections
    this.requiredQuads.clear()
    clearVisibility(this.tree)

    // list of non overlapping quads

    const cam = camera.world.getTranslation({})
    this.frustum.updateFromViewProjection(camera.view, camera.projection)
    this.tree.traverseLOD(cam, baseFactor, (it) => {
      if (!this.frustum.intersectsBox(it.bounds)) {
        return
      }

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

    traverseRequired(this.tree, fn)
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
