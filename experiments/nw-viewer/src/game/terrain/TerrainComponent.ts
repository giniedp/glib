import { MeshComponent } from '@gglib/components'
import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { TerrainHeightmapArray } from './TerrainHeightmap'
import { TerrainRegionComponent } from './TerrainRegionComponent'

export interface TerrainComponentOptions {
  regionSize: number
}

export class TerrainComponent implements GameComponent {
  public readonly entity: GameEntity

  public meshComponent: MeshComponent
  public heightmap: TerrainHeightmapArray
  public regionSize: number
  public renderRegions: TerrainRegionComponent[] = []

  public constructor(options: TerrainComponentOptions) {
    this.regionSize = options.regionSize
  }

  public initialize(): void {
    const device = this.entity.service(Device)
    this.heightmap = new TerrainHeightmapArray(device, this.regionSize)
    this.meshComponent = this.entity.getOrCreateComponent(MeshComponent, () => new MeshComponent())
  }

  public destroy(): void {
    this.heightmap.dispose()
  }

  public syncHeightmaps() {
    this.heightmap.sync(this.renderRegions)
  }

  public getNeighbourLayer(region: TerrainRegionComponent, dx: number, dy: number): number {
    for (const r of this.renderRegions) {
      if (r.xIndex === region.xIndex + dx && r.yIndex === region.yIndex + dy) {
        return this.heightmap.layerOf(r.regionName)
      }
    }
    return -1
  }
}
