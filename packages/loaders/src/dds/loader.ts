// import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
// import { ArrayBufferViewSource, SamplerState, SurfaceFormat, TextureOptions } from '@gglib/graphics'
// import { parse } from './format'

// export function registerLoader() {
//   ContentLoader.registerLoader(Loader)
// }

// export class Loader implements AssetLoader {
//   public static extensions = ['.dds']
//   public static mimeTypes = ['image/vnd.ms-dds']
//   public static loader = Loader

//   public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
//     const response = await context.content.fetch(url, {
//       responseType: 'arraybuffer',
//     })

//     const dds = parse(response.body)
//     const options: TextureOptions = {
//       width: dds.width,
//       height: dds.height,
//       type: 'Texture2D',
//       generateMipmap: false,
//       sampler: SamplerState.LinearClampNoMipMap,
//     }
//     let images: LevelImage[]
//     if (dds.isCompressed) {

//       options.surfaceFormat = data.surfaceFormat
//       options.compressed = true
//     } else {
//       images = ktx.levelImages
//       options.surfaceFormat = ktx.glInfo.surfaceFormat
//       options.pixelFormat = ktx.glInfo.format
//       options.pixelType = ktx.glInfo.type
//     }

//     const levelCount = images.length
//     const levels: Array<Array<ArrayBufferView>> = []
//     const level0 = images[0]
//     const layer0 = level0.layers[0]
//     const isCubemap = layer0.faces?.length === 6
//     for (let lvl = 0; lvl < images.length; lvl++) {
//       const level = images[lvl]
//       levels[lvl] = []
//       if (isCubemap) {
//         for (let face = 0; face < 6; face++) {
//           levels[lvl].push(level.layers[0].faces[face])
//         }
//       } else {
//         for (let layer = 0; layer < level.layers.length; layer++) {
//           levels[lvl].push(level.layers[layer].faces[0])
//         }
//       }
//     }
//     options.source = new ArrayBufferViewSource(levels, ktx.width, ktx.height)

//     // TODO: handle 3D textures and 2D arrays
//     if (isCubemap) {
//       options.type = 'TextureCube'
//     }
//     if (levelCount > 1) {
//       // options.sampler = SamplerState.LinearWrap
//     }

//     return {
//       source: url,
//       textures: [options],
//     }
//   }

//   public transcoder: Promise<Transcoder>

//   public async transcode(data: ArrayBuffer, context: LoaderContext) {
//     this.transcoder ||= transcoder({
//       wasmUrl: Loader.wasmUrl,
//     })

//     const t = await this.transcoder
//     const ktx = t.transcode(new Uint8Array(data), context.content.device.capabilities)

//     return {
//       levelImages: ktx.levelImages,
//       surfaceFormat: COMPRESSED_SURFACE_FORMATS[ktx.format],
//     }
//   }
// }

// const COMPRESSED_SURFACE_FORMATS = {
//   [BasisTranscodeFormat.ETC1_RGB]: SurfaceFormat.COMPRESSED_RGB_ETC1_WEBGL,
//   [BasisTranscodeFormat.ETC2_RGBA]: SurfaceFormat.COMPRESSED_RGBA8_ETC2_EAC,
//   [BasisTranscodeFormat.BC1_RGB]: SurfaceFormat.COMPRESSED_RGB_S3TC_DXT1_EXT,
//   [BasisTranscodeFormat.BC3_RGBA]: SurfaceFormat.COMPRESSED_RGBA_S3TC_DXT5_EXT,
//   [BasisTranscodeFormat.BC4_R]: SurfaceFormat.COMPRESSED_RED_RGTC1_EXT,
//   [BasisTranscodeFormat.BC5_RG]: SurfaceFormat.COMPRESSED_RED_GREEN_RGTC2_EXT,
//   [BasisTranscodeFormat.BC7_M6_RGB]: SurfaceFormat.COMPRESSED_RGBA_BPTC_UNORM_EXT,
//   [BasisTranscodeFormat.BC7_M5_RGBA]: SurfaceFormat.COMPRESSED_RGBA_BPTC_UNORM_EXT,
//   [BasisTranscodeFormat.PVRTC1_4_RGB]: SurfaceFormat.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
//   [BasisTranscodeFormat.PVRTC1_4_RGBA]: SurfaceFormat.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
//   [BasisTranscodeFormat.ASTC_4x4_RGBA]: SurfaceFormat.COMPRESSED_RGBA_ASTC_4x4_KHR,
//   // [BasisTranscodeFormat.ATC_RGB]: SurfaceFormat.COMPRESSED_RGB_ATC,
//   // [BasisTranscodeFormat.ATC_RGBA_INTERPOLATED_ALPHA]: SurfaceFormat.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA,
//   [BasisTranscodeFormat.RGBA32]: SurfaceFormat.RGBA8,
//   [BasisTranscodeFormat.RGB565]: SurfaceFormat.RGB565,
//   // [BasisTranscodeFormat.BGR565]: SurfaceFormat.BGR565,
//   [BasisTranscodeFormat.RGBA4444]: SurfaceFormat.RGBA4,
// }
