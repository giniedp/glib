import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { BoundingBox, Vec3 } from '@gglib/math'
import type { EntityData, LevelData, RegionReference, TerrainData } from '../api'
import { cryToGltfV3, gameCoordinate2D } from '../math'
import { levelRegion } from './LevelRegionComponent'

export interface LevelOptions {
  level: LevelData
  mapName: string
  heightmap: TerrainData
  mission: EntityData[]
}

export class LevelComponent implements GameComponent {
  private data: LevelOptions
  private bounds: [number, number, number, number]
  private boundingBox: BoundingBox

  public readonly entity: GameEntity

  public constructor(data: LevelOptions) {
    this.data = data
  }

  public initialize(): void {
    this.bounds = getMapWorldBounds(this.data.level, this.data.mapName)
    this.createWorldBounds()
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
    const centerX = (location[0] + 0.5) * regionSize
    const centerY = (location[1] + 0.5) * regionSize

    const options = levelRegion(this.entity, {
      levelName: level.name,
      regionName: region.name,
      regionSize: regionSize,
      origin: gameCoordinate2D(location[0] * regionSize, location[1] * regionSize),
      center: gameCoordinate2D(centerX, centerY),
      worldBounds: this.boundingBox,
    })
    this.entity.world.createEntity(options)
  }

  private createWorldBounds() {
    if (this.bounds) {
      this.boundingBox = getMapExtent(this.bounds)
    } else {
      this.boundingBox = null
    }
  }
}

function getMapExtent(bounds: [number, number, number, number]): BoundingBox {
  const p0 = new Vec3(...cryToGltfV3([bounds[0], bounds[1], 0]))
  const p1 = new Vec3(...cryToGltfV3([bounds[0] + bounds[2], bounds[1] + bounds[3], 2048]))
  return BoundingBox.createFromV(p0, p1)
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
