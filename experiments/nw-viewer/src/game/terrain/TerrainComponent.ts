import { MeshComponent } from '@gglib/components'
import { type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { Device, Texture, WebGpuDevice, WebGpuTexture } from '@gglib/graphics'
import { getRegionName, type TerrainData } from '../../api'
import { QUAD_LEAF_SIZE } from '../../constants'
import { TerrainRegion } from './TerrainRegion'
import { terrainRegion, TerrainRegionComponent } from './TerrainRegionComponent'

export function terrainEntity(parent: GameEntity, options: TerrainData): CreateEntityOptions {
  return {
    name: `Terrain`,
    parent: parent,
    components: [new TerrainComponent(options), new MeshComponent()],
  }
}

export class TerrainComponent implements GameComponent {
  private data: TerrainData
  public readonly entity: GameEntity
  public readonly regions: TerrainRegionComponent[] = []

  public meshComponent: MeshComponent
  public heightmap: TerrainHeightmapArray
  public renderRegions: TerrainRegionComponent[] = []

  public constructor(options: TerrainData) {
    this.data = options
  }

  public initialize(): void {
    const device = this.entity.service(Device)
    this.heightmap = new TerrainHeightmapArray(device, this.data.regionSize)
    this.meshComponent = this.entity.component(MeshComponent)

    const regionSize = this.data.regionSize
    for (let y = 0; y < this.data.regionsY; y++) {
      for (let x = 0; x < this.data.regionsX; x++) {
        const regionName = getRegionName(x, y)
        const region = new TerrainRegion({
          name: regionName,
          origin: {
            x: x * regionSize,
            y: y * regionSize,
          },
          size: regionSize,
          leafSize: QUAD_LEAF_SIZE,
        })

        region.entity = this.entity.world.createEntity(
          terrainRegion(this.entity, {
            level: this.data.level,
            region,
            regionName,
            materialData: this.data.materials?.find((it) => it.regionX === x && it.regionY === y),
            mountainHeight: this.data.mountainHeight,
          }),
        )
        const component = region.entity.component(TerrainRegionComponent)

        this.regions.push(component)
      }
    }
  }

  public destroy(): void {
    this.heightmap.dispose()
  }

  public syncHeightmaps() {
    this.heightmap.sync(this.renderRegions)
  }

  public getNeighbourLayer(region: TerrainRegion, dx: number, dy: number): number {
    for (const r of this.renderRegions) {
      if (r.region.xIndex === region.xIndex + dx && r.region.yIndex === region.yIndex + dy) {
        return this.heightmap.layerOf(r.name)
      }
    }
    return -1
  }
}

export class TerrainHeightmapArray {
  private regionToLayer = new Map<string, number>()
  private layerToRegion = new Array<string | null>(4).fill(null)
  private readonly device: Device

  public readonly texture: Texture

  public constructor(device: Device, regionSize: number) {
    this.device = device
    this.texture = device.createTexture({
      name: 'terrain-heightmap-array',
      type: 'Texture2DArray',
      format: 'R16_FLOAT',
      width: regionSize,
      height: regionSize,
      depth: 4,
      generateMipmap: false,
      mipLevelCount: 1,
    })
  }

  public sync(regions: Array<{ name: string; heightmap: Float16Array }>): void {
    for (const [regionId, slot] of this.regionToLayer) {
      let found = false
      for (const r of regions) {
        if (r.name === regionId) {
          found = true
          break
        }
      }
      if (!found) {
        this.layerToRegion[slot] = null
        this.regionToLayer.delete(regionId)
      }
    }

    for (const r of regions) {
      if (this.regionToLayer.has(r.name)) {
        continue
      }

      const slot = this.layerToRegion.findIndex((r) => r === null)
      if (slot === -1) {
        console.warn('HeightmapLayerRegistry: no free slots')
        continue
      }

      this.layerToRegion[slot] = r.name
      this.regionToLayer.set(r.name, slot)
      this.upload(slot, r.heightmap)
    }
  }

  public layerOf(regionId: string): number {
    return this.regionToLayer.get(regionId) ?? -1
  }

  private upload(slot: number, heightmap: Float16Array): void {
    const gpu = (this.device as WebGpuDevice).gpu
    const encoder = gpu.createCommandEncoder({ label: `heightmap-upload-slot${slot}` })

    const width = this.texture.width
    const height = this.texture.height

    const data = heightmap
    gpu.queue.writeTexture(
      {
        texture: (this.texture as WebGpuTexture).gpuObject,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: slot },
      },
      data.buffer,
      {
        offset: data.byteOffset,
        bytesPerRow: width * (data.byteLength / (width * height)),
        rowsPerImage: height,
      },
      {
        width,
        height,
        depthOrArrayLayers: 1,
      },
    )
    gpu.queue.submit([encoder.finish()])
  }

  public dispose(): void {
    this.texture.dispose()
  }
}
