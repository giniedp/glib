import { type GameComponent, type GameEntity } from '@gglib/ecs'
import type { TerrainData } from '../api'
import { QUAD_LEAF_SIZE } from '../constants'
import { TerrainRegion } from './TerrainRegion'
import { terrainRegion } from './TerrainRegionComponent'

export class TerrainComponent implements GameComponent {
  private data: TerrainData
  public readonly entity: GameEntity
  public readonly regions: TerrainRegion[] = []

  public constructor(options: TerrainData) {
    this.data = options
    const regionSize = options.regionSize

    for (let y = 0; y < this.data.regionsY; y++) {
      for (let x = 0; x < this.data.regionsX; x++) {
        this.regions.push(
          new TerrainRegion({
            origin: {
              x: x * regionSize,
              y: y * regionSize,
            },
            size: regionSize,
            leafSize: QUAD_LEAF_SIZE,
          }),
        )
      }
    }
  }

  public initialize(): void {
    for (const region of this.regions) {
      if (region.entity) {
        continue
      }
      const regionSize = this.data.regionSize
      const x = region.origin.x / regionSize
      const y = region.origin.y / regionSize
      region.entity = this.entity.world.createEntity(
        terrainRegion(this.entity, {
          level: this.data.level,
          region,
          materialData: this.data.materials?.find((it) => it.regionX === x && it.regionY === y),
          mountainHeight: this.data.mountainHeight,
        }),
      )
    }
  }

  public destroy(): void {
    // TODO: destroy geometries
  }
}
