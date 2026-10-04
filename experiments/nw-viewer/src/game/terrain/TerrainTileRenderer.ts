import { BlendState, Color, Texture, TextureUsage, WebGpuTexture, type Device } from '@gglib/graphics'
import { ALBEDO_MULTIPLIER, TERRAIN_TILE_TEXTURE_MIP_COUNT } from '../../constants'
import { BC3Encoder } from '../../graphics'
import { SplatPackMaterial, type TerrainCompositeMaterial } from '../../material'
import type { TerrainTile } from './TerrainTileManager'

export interface TileRendererOptions {
  width: number
  height: number
}

export class TerrainTileRenderer {
  private device: Device

  private stagingMap1: Texture
  private stagingMap2: Texture
  private stagingMap3: Texture

  private combine: SplatPackMaterial
  private encoder: BC3Encoder

  public constructor(device: Device, options: TileRendererOptions) {
    this.device = device
    const width = options.width
    const height = options.height
    if (width < 1 || height < 1) {
      throw new Error('width and height must be at least 1')
    }

    this.combine = new SplatPackMaterial(this.device, { properties: {} })
    this.encoder = new BC3Encoder(this.device, options)

    this.stagingMap1 = this.device.createTexture({
      format: 'rgba8unorm',
      width: width,
      height: height,
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount: TERRAIN_TILE_TEXTURE_MIP_COUNT,
    })
    this.stagingMap2 = this.device.createTexture({
      format: 'rgba8unorm',
      width: width,
      height: height,
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount: TERRAIN_TILE_TEXTURE_MIP_COUNT,
    })
    this.stagingMap3 = this.device.createTexture({
      format: 'rgba8unorm',
      width: width,
      height: height,
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount: TERRAIN_TILE_TEXTURE_MIP_COUNT,
    })
  }

  public render(
    tile: TerrainTile,
    tileArrays: Texture[],
    baseMaterial: TerrainCompositeMaterial,
    layerMaterials: TerrainCompositeMaterial[],
  ) {
    //
    // 1. blend layers into intermediate maps
    //
    const pass = this.device.renderPass
    pass.flush()
    pass.setRenderTarget(0, this.stagingMap1)
    pass.setRenderTarget(1, this.stagingMap2)
    pass.setRenderTarget(2, this.stagingMap3)
    pass.setClearColor(0, Color.White) // base color
    pass.setClearColor(1, Color.Black)
    pass.setClearColor(2, Color.LimeGreen) // normal
    pass.setRenderBlend(0, BlendState.AlphaPremultiplied)
    pass.setRenderBlend(1, BlendState.AlphaPremultiplied)
    pass.setRenderBlend(2, BlendState.AlphaPremultiplied)
    pass.setViewportState(0, 0, this.stagingMap1.width, this.stagingMap1.height)
    pass.clear()

    if (baseMaterial) {
      baseMaterial.RegionScaleOffset = tile.macroUvTransform
      baseMaterial.TilingScaleOffset = tile.colorUvTransform
      baseMaterial.effect.applyInputs(baseMaterial.inputBlocks)
      baseMaterial.effect.program.commit()
      pass.setProgram(baseMaterial.effect.program)
      pass.draw(3)
    }

    if (layerMaterials) {
      for (const material of layerMaterials) {
        material.BaseMap.width
        material.RegionScaleOffset = tile.macroUvTransform
        material.TilingScaleOffset = tile.colorUvTransform
        material.effect.applyInputs(material.inputBlocks)
        material.effect.program.commit()
        pass.setProgram(material.effect.program)
        pass.draw(3)
      }
    }

    pass.flush()

    //
    // 2. generate mipmaps, so we can encode them individually in the next step
    //

    this.stagingMap1.updateMipmaps()
    this.stagingMap2.updateMipmaps()
    this.stagingMap3.updateMipmaps()
    pass.flush()

    //
    // 3. pack and encode
    //

    for (let mipLevel = 0; mipLevel < this.stagingMap1.mipLevelCount; mipLevel++) {
      const mipResolution = this.stagingMap1.width >> mipLevel

      // texture 1
      // rgb = base color scaled with factor 8.0 for better precision in bc3 encoding
      //
      this.encoder.encode(
        this.stagingMap1, // take RGB
        this.stagingMap3, // take R as alpha
        tileArrays[0] as WebGpuTexture,
        tile.slot.layer,
        mipResolution,
        mipLevel,
        ALBEDO_MULTIPLIER, // rgbScale
        'r', // alphaSelector
      )

      pass.flush()
    }

    for (let mipLevel = 0; mipLevel < this.stagingMap1.mipLevelCount; mipLevel++) {
      const mipResolution = this.stagingMap1.width >> mipLevel

      this.encoder.encode(
        this.stagingMap2, // take RGB
        this.stagingMap3, // take G as alpha
        tileArrays[1] as WebGpuTexture,
        tile.slot.layer,
        mipResolution,
        mipLevel,
        1.0, // rgbScale
        'g', // alphaSelector
      )
      pass.flush()
    }
  }

  public dispose() {
    this.stagingMap1.dispose()
    this.stagingMap2.dispose()
    this.stagingMap3.dispose()

    this.combine.dispose()
    this.encoder.dispose()
  }
}
