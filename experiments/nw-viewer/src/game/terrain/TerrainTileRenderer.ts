import { BlendState, Color, Texture, TextureUsage, WebGpuDevice, WebGpuTexture, type Device } from '@gglib/graphics'
import { BC3Encoder } from '../../graphics'
import { SplatPackMaterial, type TerrainCompositeMaterial } from '../../material'
import type { TerrainTile } from './TerrainTileManager'
import { ALBEDO_MULTIPLIER } from '../../constants'

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

    this.combine = new SplatPackMaterial(this.device)
    this.encoder = new BC3Encoder(this.device, options)

    this.stagingMap1 = this.device.createTexture({
      format: 'RGBA8_UNORM',
      width: width,
      height: height,
      usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount: 1,
    })
    this.stagingMap2 = this.device.createTexture({
      format: 'RGBA8_UNORM',
      width: width,
      height: height,
      usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount: 1,
    })
    this.stagingMap3 = this.device.createTexture({
      format: 'RGBA8_UNORM',
      width: width,
      height: height,
      usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount: 1,
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
      baseMaterial.RegionScaleOffset.initFrom(tile.macroUvTransform)
      baseMaterial.TilingScaleOffset.initFrom(tile.colorUvTransform)
      baseMaterial.effect.commit(baseMaterial.inputs)
      pass.setProgram(baseMaterial.effect.program)
      pass.draw(3)
    }

    if (layerMaterials) {
      for (const material of layerMaterials) {
        material.BaseMap.width
        material.RegionScaleOffset.initFrom(tile.macroUvTransform)
        material.TilingScaleOffset.initFrom(tile.colorUvTransform)
        material.effect.commit(material.inputs)
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

    // if (doDebug) {
    //   dumpTextureToPng(this.device, this.stagingMap1, 'debug/staging1_mip1.png', 1)
    //   // dumpTextureToPng(this.device, this.stagingMap1, 'debug/staging1_mip2.png', 2)
    //   // dumpTextureToPng(this.device, this.stagingMap1, 'debug/staging1_mip4.png', 4)
    // }

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
    //console.log(`tile layer=${tile.slot.layer} wrote ${writtenMips} mip levels`)
    // if (doDebug) {
    // }
    // dumpLayerToDDS(
    //   `v-${tile.renderVersion}_debug_tile_layer${tile.slot.layer}.dds`,
    //   tileArrays[0] as WebGpuTexture,
    //   tile.slot.layer,
    //   this.stagingMap1.width,
    //   this.stagingMap1.mipLevelCount,
    // )
  }

  public dispose() {
    this.stagingMap1.dispose()
    this.stagingMap2.dispose()
    this.stagingMap3.dispose()

    this.combine.dispose()
    this.encoder.dispose()
  }

  public async dumpTexture(filename: string, texture: Texture) {
    for (let layer = 0; layer < texture.depth; layer++) {
      await dumpLayerToDDS(
        `${filename}_layer${layer}.dds`,
        texture as WebGpuTexture,
        layer,
        texture.width,
        texture.mipLevelCount,
      )
    }
  }
}

export async function dumpTextureToPng(
  device: Device,
  texture: Texture,
  filename: string,
  mipLevel: number = 0,
  arrayLayer: number = 0,
): Promise<void> {
  const gpu = (device as WebGpuDevice).gpu
  const gpuTex = (texture as WebGpuTexture).gpuObject

  const width = Math.max(1, texture.width >> mipLevel)
  const height = Math.max(1, texture.height >> mipLevel)

  const bytesPerRow = Math.ceil((width * 4) / 256) * 256
  const bufferSize = bytesPerRow * height

  const readbackBuffer = gpu.createBuffer({
    label: 'texture-dump-readback',
    size: bufferSize,
    usage: 8 | 1,
    // usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })

  const encoder = gpu.createCommandEncoder({ label: 'texture-dump' })
  encoder.copyTextureToBuffer(
    { texture: gpuTex, mipLevel, origin: { x: 0, y: 0, z: arrayLayer } },
    { buffer: readbackBuffer, bytesPerRow, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  )
  gpu.queue.submit([encoder.finish()])

  await readbackBuffer.mapAsync(1)
  // await readbackBuffer.mapAsync(GPUMapMode.READ)
  const raw = new Uint8Array(readbackBuffer.getMappedRange())

  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    const src = y * bytesPerRow
    const dst = y * width * 4
    rgba.set(raw.subarray(src, src + width * 4), dst)
  }

  readbackBuffer.unmap()
  readbackBuffer.destroy()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0)

  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
async function dumpLayerToDDS(
  filename: string,
  src: WebGpuTexture,
  layer: number,
  resolution: number,
  mipCount: number,
): Promise<void> {
  const gpu = (src as any).device.gpu // or pass device separately

  // calculate total DDS data size across all mips
  let totalBytes = 0
  for (let mip = 0; mip < mipCount; mip++) {
    const mipRes = Math.max(4, resolution >> mip)
    const blocksX = Math.ceil(mipRes / 4)
    const blocksY = Math.ceil(mipRes / 4)
    totalBytes += blocksX * blocksY * 16
  }

  const ddsBuffer = new ArrayBuffer(128 + totalBytes)
  const ddsView = new DataView(ddsBuffer)
  const ddsBytes = new Uint8Array(ddsBuffer)

  // DDS header
  ddsView.setUint32(0, 0x20534444, true) // 'DDS '
  ddsView.setUint32(4, 124, true)
  ddsView.setUint32(8, 0x00021007, true)
  ddsView.setUint32(12, resolution, true)
  ddsView.setUint32(16, resolution, true)
  ddsView.setUint32(20, 0, true)
  ddsView.setUint32(24, 0, true)
  ddsView.setUint32(28, mipCount, true)
  for (let i = 32; i < 76; i += 4) ddsView.setUint32(i, 0, true)
  ddsView.setUint32(76, 32, true)
  ddsView.setUint32(80, 0x4, true)
  ddsView.setUint32(84, 0x35545844, true) // 'DXT5'
  for (let i = 88; i < 108; i += 4) ddsView.setUint32(i, 0, true)
  ddsView.setUint32(108, 0x00401008, true)
  for (let i = 112; i < 128; i += 4) ddsView.setUint32(i, 0, true)

  let offset = 128
  for (let mip = 0; mip < mipCount; mip++) {
    const mipRes = Math.max(4, resolution >> mip)
    const blocksX = Math.ceil(mipRes / 4)
    const blocksY = Math.ceil(mipRes / 4)
    const mipBytes = blocksX * blocksY * 16
    const bytesPerRow = Math.ceil((blocksX * 16) / 256) * 256
    const bufSize = bytesPerRow * blocksY

    const readback = gpu.createBuffer({
      label: `dds-readback-mip${mip}`,
      size: bufSize,
      usage: 8 | 1,
    })

    const encoder = gpu.createCommandEncoder({ label: `dds-copy-mip${mip}` })
    encoder.copyTextureToBuffer(
      {
        texture: src.gpuObject,
        mipLevel: mip,
        origin: { x: 0, y: 0, z: layer },
      },
      {
        buffer: readback,
        bytesPerRow: bytesPerRow,
        rowsPerImage: blocksY,
      },
      {
        width: mipRes,
        height: mipRes,
        depthOrArrayLayers: 1,
      },
    )
    gpu.queue.submit([encoder.finish()])

    await readback.mapAsync(1)
    const raw = new Uint8Array(readback.getMappedRange())

    // strip bytesPerRow padding
    for (let row = 0; row < blocksY; row++) {
      const src = row * bytesPerRow
      const dst = offset + row * blocksX * 16
      ddsBytes.set(raw.subarray(src, src + blocksX * 16), dst)
    }

    offset += mipBytes
    readback.unmap()
    readback.destroy()
  }

  const blob = new Blob([ddsBuffer], { type: 'application/octet-stream' })
  const link = document.createElement('a')
  link.download = filename
  link.href = URL.createObjectURL(blob)
  link.click()
}
