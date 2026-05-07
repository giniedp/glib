import { Device, Texture, TextureUsage } from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import { removeItemUnordered } from '@gglib/utils'
import { MATERIAL_TEXTURE_SIZE } from '../constants'

export class TerrainTileManager {
  private device: Device

  private activeTiles: TerrainTile[] = []
  private freeTiles: TerrainTile[] = []
  private keepAliveCount = 16

  public constructor(device: Device) {
    this.device = device
  }

  public dispose(): void {
    for (const tile of this.activeTiles) {
      this.disposeTile(tile)
    }
    for (const tile of this.freeTiles) {
      this.disposeTile(tile)
    }
    this.activeTiles.length = 0
    this.freeTiles.length = 0
  }

  public acquireTile(): TerrainTile {
    if (this.freeTiles.length > 0) {
      const result = this.freeTiles[0]
      removeItemUnordered(this.freeTiles, result)
      this.activeTiles.push(result)
      result.lastSeen = performance.now()
      result.renderVersion = -1

      return result
    }
    const result = this.createTile()
    this.activeTiles.push(result)
    return result
  }

  public releaseTile(tile: TerrainTile) {
    if (!removeItemUnordered(this.activeTiles, tile)) {
      throw new Error('tile not found')
    }
    tile.lastSeen = performance.now()
    if (this.freeTiles.length < this.keepAliveCount) {
      this.freeTiles.push(tile)
    } else {
      this.disposeTile(tile)
    }
  }

  private createTile(): TerrainTile {
    return {
      renderVersion: -1,
      lastSeen: performance.now(),
      texture1: this.device.createRenderTarget({
        format: 'RGBA8_UNORM',
        width: MATERIAL_TEXTURE_SIZE,
        height: MATERIAL_TEXTURE_SIZE,
        usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
        generateMipmap: true,
      }),
      texture2: this.device.createRenderTarget({
        format: 'RGBA8_UNORM',
        width: MATERIAL_TEXTURE_SIZE,
        height: MATERIAL_TEXTURE_SIZE,
        usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
        generateMipmap: true,
      }),

      macroUvTransform: Vec4.create(1, 1, 0, 0),
      tileUvTransform: Vec4.create(1, 1, 0, 0),
    }
  }

  private disposeTile(tile: TerrainTile) {
    tile.texture1.dispose()
    tile.texture2.dispose()
  }
}

export interface TerrainTile {
  lastSeen: number
  texture1: Texture
  texture2: Texture
  macroUvTransform: Vec4
  tileUvTransform: Vec4
  renderVersion: number
}
