import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { vec3 } from '@gglib/math'
import type { EntityData, LevelData, RegionReference, TerrainData } from '../../api'

import { levelRegion, RegionComponent } from '../region/RegionComponent'

export interface LevelOptions {
  level: LevelData
  mapName: string
  heightmap: TerrainData
  mission: EntityData[]
}

export interface LevelRegionLink {
  entity: GameEntity
  component: RegionComponent
}

export class LevelComponent implements GameComponent {
  private data: LevelOptions
  private bounds: [number, number, number, number]

  public readonly entity: GameEntity
  public readonly regions: LevelRegionLink[] = []

  public constructor(data: LevelOptions) {
    this.data = data
  }

  public initialize(): void {
    this.bounds = getMapWorldBounds(this.data.level, this.data.mapName)
    this.createRegions(this.data.level.regions)
  }

  public activate(): void {
    console.log('activate level', this)
  }

  public destroy(): void {
    //
  }

  private createRegions(regions: RegionReference[]) {
    if (!regions) {
      return
    }
    for (const region of regions) {
      this.createRegion(region)
    }
  }

  private createRegion(region: RegionReference) {
    const level = this.data.level
    const location = region.location
    const regionSize = level.regionSize

    const options = levelRegion(this.entity, {
      levelName: level.name,
      regionName: region.name,
      regionSize: regionSize,
      origin: vec3([location[0] * regionSize, location[1] * regionSize, 0]),
      size: regionSize,
    })
    const entity = this.entity.world.createEntity(options)

    this.regions.push({
      entity,
      component: entity.component(RegionComponent),
    })
  }
}

function getMapWorldBounds(info: LevelData, map: string): [number, number, number, number] {
  if (!info || !info.maps || !map) {
    return null
  }
  const mapInfo = info.maps.find((it) => it.gameModeMapId.toLowerCase() === map.toLowerCase())
  if (!mapInfo || !mapInfo.worldBounds) {
    console.warn('map not found ', map)
    return null
  }
  const bounds = mapInfo.worldBounds.split(',').map(Number)
  if (bounds.length !== 4) {
    console.warn('Invalid world bounds', mapInfo.worldBounds)
    return null
  }
  if (bounds.some((it) => !Number.isFinite(it) || Number.isNaN(it))) {
    console.warn('Invalid world bounds', mapInfo.worldBounds)
    return null
  }
  return bounds as [number, number, number, number]
}
