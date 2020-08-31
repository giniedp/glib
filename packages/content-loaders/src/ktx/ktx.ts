import { loader, Loader } from '@gglib/content'
import { KTX } from './format'
import { Texture } from '@gglib/graphics'

/**
 * Downloads an array buffer from source and parses with the KTX parser
 * @public
 */
export const loadKtxToKtx: Loader<string, KTX> = loader({
  input: ['.ktx', '.ktx2', 'image/ktx2', 'image/ktx'],
  output: KTX,
  handle: async (_, context) => {
    return context.manager.downloadArrayBuffer(context.source).then((res) => KTX.parse(res.content))
  },
})

/**
 * Converts a KTX image into Texture options
 * @public
 */
export const loadKtxToTexture2D: Loader<KTX, Texture> = loader({
  input: KTX,
  output: Texture.Texture2D,
  handle: async (ktx: KTX, context): Promise<Texture> => {
    // TODO: check for webgl2 / extension requirement
    const level0 = ktx.levelImages[0]
    const layer0 = level0.layers[0]
    return context.manager.device.createTexture2D({
      surfaceFormat: ktx.glInfo.glInternalFormat,
      pixelFormat: ktx.glInfo.glFormat,
      pixelType: ktx.glInfo.glType,
      source: layer0.faces[0],
      width: ktx.width,
      height: ktx.height,
    })
  },
})

/**
 * Converts a KTX image into Texture options
 * @public
 */
export const loadKtxToTextureCube: Loader<KTX, Texture> = loader({
  input: KTX,
  output: Texture.TextureCube,
  handle: async (ktx: KTX, context): Promise<Texture> => {
    // TODO: check for webgl2 / extension requirement
    const level0 = ktx.levelImages[0]
    const layer0 = level0.layers[0]

    return context.manager.device.createTextureCube({
      surfaceFormat: ktx.glInfo.glInternalFormat,
      pixelFormat: ktx.glInfo.glFormat,
      pixelType: ktx.glInfo.glType,
      faces: layer0.faces.map((face) => {
        return {
          data: face,
          width: ktx.width,
          height: ktx.height,
        }
      })
    })
  },
})
