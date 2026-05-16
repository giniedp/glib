import { LifeCyclePropagate, SchedulerSystem, TransformComponent, type ScheduledTask } from '@gglib/components'
import type { CreateEntityOptions, GameComponent, GameEntity } from '@gglib/ecs'
import type { RegionMaterial } from '../../api'
import { ContentService } from '../../content'
import { TerrainCompositeMaterial } from '../../material'
import { gameCoordinate2D, gameToRenderCoordinate } from '../../math'
import type { TerrainRegion, TerraQuad } from './TerrainRegion'
import { loadBaseMaterial, loadHeightmap, loadLayerMaterials } from './loaders'

export interface TerrainRegionComponentOptions {
  level: string
  region: TerrainRegion
  regionName: string
  materialData: RegionMaterial
  mountainHeight: number
}

export function terrainRegion(parent: GameEntity, options: TerrainRegionComponentOptions): CreateEntityOptions {
  const origin = gameCoordinate2D(options.region.origin.x, options.region.origin.y)
  const position = gameToRenderCoordinate(origin, 0)
  return {
    name: `Terrain Region [${options.region.xIndex};${options.region.yIndex}]`,
    parent,
    transform: new TransformComponent({
      position,
      keepWorld: true,
      lifeCycle: LifeCyclePropagate,
    }),
    components: [new TerrainRegionComponent(options)],
  }
}

export function terrainPatchEntity(parent: GameEntity, quad: TerraQuad): CreateEntityOptions {
  const { min } = quad.bounds

  const origin = gameCoordinate2D(min.x, min.z)
  const position = gameToRenderCoordinate(origin, 0)
  return {
    name: `Terrain Patch [${quad.rootGridX};${quad.rootGridZ}]`,
    parent: parent,
    transform: new TransformComponent({
      position: position,
      keepWorld: true,
    }),
  }
}

export class TerrainRegionComponent implements GameComponent {
  public entity: GameEntity

  private content: ContentService
  private scheduler: SchedulerSystem

  private mountainHeight: number
  private materialData: RegionMaterial

  public heightmap: Float16Array
  private heightmapTask: ScheduledTask

  // public watermap: Float16Array
  // private watermapTask: ScheduledTask

  public layerMaterials: TerrainCompositeMaterial[] | null = null
  private layerMaterialsTask: ScheduledTask

  public baseMaterial: TerrainCompositeMaterial
  private baseMaterialTask: ScheduledTask

  public materialVersion = 0

  public readonly region: TerrainRegion
  public get regionSize(): number {
    return this.region.size
  }

  public readonly level: string
  public readonly name: string
  public constructor(options: TerrainRegionComponentOptions) {
    this.level = options.level
    this.region = options.region
    this.name = options.regionName
    this.materialData = options.materialData
    this.mountainHeight = options.mountainHeight
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scheduler = this.entity.service(SchedulerSystem)

    for (const node of this.region.tree.flatPreOrdered) {
      node.data.entity = this.entity.world.createEntity(terrainPatchEntity(this.entity, node))
      node.data.region = this.region
    }
  }

  public activate() {
    this.loadHeightmap()
    // this.loadWatermap()
    this.loadBaseMaterial()
    this.loadLayerMaterials()
  }

  public deactivate() {
    this.disposeLayerMaterials()
    this.disposeMacroMaterial()
    this.disposeHeightmap()

    if (this.layerMaterialsTask) {
      this.layerMaterialsTask.cancelled = true
      this.layerMaterialsTask = null
    }

    if (this.baseMaterialTask) {
      this.baseMaterialTask.cancelled = true
      this.baseMaterialTask = null
    }

    if (this.heightmapTask) {
      this.heightmapTask.cancelled = true
      this.heightmapTask = null
    }

    // if (this.watermapTask) {
    //   this.watermapTask.cancelled = true
    //   this.watermapTask = null
    // }
  }

  public destroy(): void {
    this.deactivate()
  }

  private disposeMacroMaterial() {
    this.baseMaterial?.dispose()
    this.baseMaterial = null
  }

  private disposeLayerMaterials() {
    const toDispose = this.layerMaterials
    this.layerMaterials = null
    if (toDispose) {
      for (const material of toDispose) {
        material.dispose()
      }
    }
  }

  private disposeHeightmap() {
    this.heightmap = null
  }

  private loadBaseMaterial() {
    if (this.baseMaterial || this.baseMaterialTask) {
      return
    }
    this.baseMaterialTask = loadBaseMaterial(this.content, this.scheduler, this.materialData, (result) => {
      this.baseMaterialTask = null
      this.baseMaterial = result
      this.syncMacroTextures()
      this.materialVersion++
    })
  }

  private loadLayerMaterials() {
    if (this.layerMaterials || this.layerMaterialsTask) {
      return
    }
    this.layerMaterialsTask = loadLayerMaterials(this.content, this.scheduler, this.materialData, (result) => {
      this.layerMaterialsTask = null
      this.layerMaterials = result || []
      this.syncMacroTextures()
      this.materialVersion++
    })
  }

  private syncMacroTextures() {
    if (this.baseMaterial) {
      this.baseMaterial.MacroNormalScale = 1 / this.mountainHeight
    } else {
      return
    }

    if (!this.layerMaterials?.length) {
      return
    }

    for (const material of this.layerMaterials) {
      material.MacroBaseMap = this.baseMaterial.MacroBaseMap
      material.MacroNormalMap = this.baseMaterial.MacroNormalMap
      material.MacroGlossMap = this.baseMaterial.MacroGlossMap
      material.MacroNormalScale = 1 / this.mountainHeight
    }
  }

  private loadHeightmap() {
    if (this.heightmap || this.heightmapTask) {
      return
    }
    this.heightmapTask = loadHeightmap(this.content, this.scheduler, this.level, this.name, (result) => {
      this.heightmapTask = null
      this.heightmap = result
    })
  }

  // private loadWatermap() {
  //   if (this.watermap || this.watermapTask) {
  //     return
  //   }
  //   this.watermapTask = loadWatermap(this.content, this.level, this.name, (result) => {
  //     this.watermapTask = null
  //     this.watermap = result
  //   })
  // }
}
