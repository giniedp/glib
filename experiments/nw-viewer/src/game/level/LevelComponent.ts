import { type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'

import { TransformComponent } from '@gglib/components'
import type { LevelInfo, RegionLocation } from '../../api'
import { RegionComponent, regionEntityOptions } from '../region/RegionComponent'
import { TerrainComponent } from '../terrain/TerrainComponent'

export interface LevelRegionLink {
  entity: GameEntity
  component: RegionComponent
}

export function levelEntityOptions(parent: GameEntity, options: LevelInfo): CreateEntityOptions {
  return {
    parent,
    name: `Level ${options.name}`,
    transform: new TransformComponent({}),
    components: [new LevelComponent(options)],
  }
}

export class LevelComponent implements GameComponent {
  public readonly data: LevelInfo
  public readonly entity: GameEntity

  public sky: GameEntity
  public terrain: GameEntity

  public constructor(data: LevelInfo) {
    this.data = data
  }

  public initialize(): void {
    this.createTerrain()
    this.createRegions(this.data.regions)
  }

  public activate(): void {
    //
  }

  public destroy(): void {
    //
  }

  private createTerrain() {
    const hasTerrain = this.data.mountainHeight > 256
    if (!hasTerrain) {
      return
    }
    this.entity.world.createEntity({
      name: 'Terrain',
      parent: this.entity,
      transform: new TransformComponent(),
      components: [
        new TerrainComponent({
          regionSize: this.data.regionSize,
        }),
      ],
    })
  }

  private createRegions(regions: RegionLocation[]) {
    if (!regions?.length) {
      return
    }
    for (const region of regions) {
      this.createRegion(region)
    }
  }

  private createRegion(region: RegionLocation) {
    const location = region.location
    const regionSize = this.data.regionSize
    const cellSize = this.data.regionCellSize
    const options = regionEntityOptions(this.entity, {
      coatlicueName: this.data.name,
      regionName: region.name,
      regionSize,
      cellSize,
      origin: new Vec3(location[0] * regionSize, location[1] * regionSize, 0),
      mountainHeight: this.data.mountainHeight,
      oceanLevel: this.data.oceanLevel,
    })
    this.entity.world.createEntity(options)
  }
}
