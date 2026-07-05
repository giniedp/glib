import type { Device, Texture, WebGpuDevice, WebGpuTexture } from '@gglib/graphics'

export class TerrainHeightmapArray {
  private regionToLayer = new Map<string, number>()
  private layerToRegion = new Array<string | null>(4).fill(null)
  private readonly device: Device

  public readonly texture: Texture
  public readonly texture2: Texture

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
    this.texture2 = device.createTexture({
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

  public sync(regions: Array<{ regionName: string; heightmap: Float16Array; watermap: Float16Array }>): void {
    for (const [regionId, slot] of this.regionToLayer) {
      let found = false
      for (const r of regions) {
        if (r.regionName === regionId) {
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
      if (this.regionToLayer.has(r.regionName)) {
        continue
      }

      const slot = this.layerToRegion.findIndex((r) => r === null)
      if (slot === -1) {
        console.warn('HeightmapLayerRegistry: no free slots')
        continue
      }

      this.layerToRegion[slot] = r.regionName
      this.regionToLayer.set(r.regionName, slot)
      this.upload(slot, r.heightmap, this.texture)
      this.upload(slot, r.watermap, this.texture2)
    }
  }

  public layerOf(regionId: string): number {
    return this.regionToLayer.get(regionId) ?? -1
  }

  private upload(slot: number, data: Float16Array, target: Texture): void {
    const gpu = (this.device as WebGpuDevice).gpu
    const encoder = gpu.createCommandEncoder({ label: `heightmap-upload-slot${slot}` })

    const width = target.width
    const height = target.height

    gpu.queue.writeTexture(
      {
        texture: (target as WebGpuTexture).gpuObject,
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
    this.texture2.dispose()
  }
}
