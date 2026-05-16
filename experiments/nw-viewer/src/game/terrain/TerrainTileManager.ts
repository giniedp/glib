import { Device } from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import { addItemIfAbsent } from '@gglib/utils'
import { MATERIAL_TEXTURE_SIZE } from '../../constants'
import { TileTexturManager, type TileSlotHandle } from '../../graphics'
import type { TerrainCompositeMaterial } from '../../material'
import { TerrainTileRenderer } from './TerrainTileRenderer'

export interface TerrainTile {
  slot: TileSlotHandle
  macroUvTransform: Vec4
  colorUvTransform: Vec4
  renderVersion: number
}

export class TerrainTileManager {
  private device: Device

  private texture: TileTexturManager
  private renderer: TerrainTileRenderer
  private tiles: TerrainTile[] = []

  public get colorMap1() {
    return this.texture.textures[0]
  }

  public get colorMap2() {
    return this.texture.textures[1]
  }

  private sharedSlot: TileSlotHandle

  public constructor(device: Device) {
    this.device = device

    this.texture = new TileTexturManager(this.device, {
      capacity: 512,
      width: MATERIAL_TEXTURE_SIZE,
      height: MATERIAL_TEXTURE_SIZE,
      formats: ['BC3_RGBA_UNORM', 'BC3_RGBA_UNORM'],
      labels: ['TileMat1', 'TileMat2'],
      generateMipmap: false,
      mipLevelCount: 1,
    })
    this.renderer = new TerrainTileRenderer(this.device, {
      width: MATERIAL_TEXTURE_SIZE,
      height: MATERIAL_TEXTURE_SIZE,
    })

    this.sharedSlot = this.texture.acquire(true)
  }

  public dispose(): void {
    this.texture.dispose()
    this.renderer.dispose()
  }

  public acquireTile(): TerrainTile {
    const tile =
      this.tiles.pop() ||
      ({
        renderVersion: -1,
        slot: null,
        macroUvTransform: Vec4.create(1, 1, 0, 0),
        colorUvTransform: Vec4.create(1, 1, 0, 0),
      } satisfies TerrainTile)

    if (this.texture.availableLayers) {
      tile.slot = this.texture.acquire()
    } else {
      console.warn('No available tile slots, using shared slot')
      tile.slot = this.sharedSlot
    }

    tile.renderVersion = -1
    tile.macroUvTransform.init(1, 1, 0, 0)
    tile.colorUvTransform.init(1, 1, 0, 0)
    return tile
  }

  public releaseTile(tile: TerrainTile) {
    if (tile.slot === this.sharedSlot) {
      // do not release shared slot
      tile.slot = null
    } else {
      this.texture.release(tile.slot)
      tile.slot = null
    }
    addItemIfAbsent(this.tiles, tile)
  }

  public renderTile(
    tile: TerrainTile,
    baseMaterial: TerrainCompositeMaterial,
    layerMaterials: TerrainCompositeMaterial[],
  ) {
    this.renderer.render(tile, this.texture.textures, baseMaterial, layerMaterials)
  }

  public dumpDds() {
    debugger
    this.renderer.dumpTexture('tile_dump.png', this.texture.textures[0])
  }
}
