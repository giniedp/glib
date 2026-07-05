import { QuadTree, QuadTreeNode, type ScheduledTask } from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { BoundingFrustum, Vec3, type IVec2 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { brand, lfmt, type Brand } from '@gglib/utils'
import type { TerrainCompositeMaterial } from '../../material'
import type { TerrainTile } from './TerrainTileManager'
import { QUAD_LEAF_SIZE } from '../../constants'
import type { RegionMaterial } from '../../api'

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

  region: TerrainRegionComponent

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
  regionName: string
  coatlicueName: string
  origin: IVec2
  regionSize: number
  mountainHeight: number
  regionMaterial: RegionMaterial
}

export class TerrainRegionComponent implements GameComponent {
  public get xIndex() {
    return this.origin.x / this.size
  }
  public get yIndex() {
    return this.origin.y / this.size
  }

  public heightmap: Float16Array
  public heightmapTask: ScheduledTask | null

  public watermap: Float16Array
  public watermapTask: ScheduledTask | null

  public baseMaterial: TerrainCompositeMaterial
  public baseMaterialTask: ScheduledTask | null

  public layerMaterials: TerrainCompositeMaterial[]
  public layerMaterialsTask: ScheduledTask | null

  public materialVersion: number = 0
  public materialData: RegionMaterial

  public readonly coatlicueName: string
  public readonly regionName: string
  public readonly origin: IVec2
  public readonly size: number
  public readonly tree: TerraRoot
  public readonly leafSize: number
  public readonly maxLevel: number
  public readonly mountainHeight: number

  private frustum: BoundingFrustum = new BoundingFrustum()
  private requiredQuads = new Set<TerraQuad>()
  private logTag = lfmt.badge('#4E79A7', '⛰️ TerrainRegionComponent')
  public constructor(options: TerrainRegionOptions) {
    this.logTag = lfmt.merge(this.logTag, lfmt.badge('#BAB0AC', `${options.regionName}`))
    this.regionName = options.regionName
    this.coatlicueName = options.coatlicueName
    this.size = options.regionSize
    this.origin = options.origin
    this.leafSize = QUAD_LEAF_SIZE
    this.mountainHeight = options.mountainHeight
    this.materialData = options.regionMaterial

    console.assert(!!this.regionName, 'RegionComponent: regionName is required')
    console.assert(!!this.coatlicueName, 'RegionComponent: coatlicueName is required')
    console.assert(this.size > 0, 'RegionComponent: size must be greater than 0')
    console.assert(this.leafSize > 0, 'RegionComponent: leafSize must be greater than 0')
    console.assert(this.size % this.leafSize === 0, 'RegionComponent: size must be a multiple of leafSize')

    this.tree = QuadTree.create({
      min: new Vec3(this.origin.x, this.origin.y, 0),
      max: new Vec3(this.origin.x + this.size, this.origin.y + this.size, this.size),
      verticalAxis: 'z',
    })

    this.tree.subdivideTosize(this.leafSize)
    this.maxLevel = Math.log2(this.size / this.leafSize)
    for (const node of this.tree.flatPreOrdered) {
      node.data.region = this
      node.data.visible = false
    }
  }

  // #region GameComponent interface
  public readonly entity: GameEntity
  public initialize(): void {
    //
  }
  public activate(): void {
    console.log(...lfmt.merge(this.logTag, lfmt.green('Activated')))
  }
  public deactivate(): void {
    console.log(...lfmt.merge(this.logTag, lfmt.red('Deactivated')))
  }
  public destroy(): void {
    //
  }
  // #endregion

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
