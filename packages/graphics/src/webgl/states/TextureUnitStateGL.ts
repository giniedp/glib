import { Texture, TextureImage } from '../../resources'
import { SamplerState, TextureUnitState } from '../../states'
import { DeviceGL } from '../DeviceGL'
import { TextureGL } from '../resources'
import { SamplerStateGL } from './SamplerStateGL'

const TextureUnitMap = [
  0x84c0, 0x84c1, 0x84c2, 0x84c3, 0x84c4, 0x84c5, 0x84c6, 0x84c7, 0x84c8, 0x84c9, 0x84ca, 0x84cb, 0x84cc, 0x84cd,
  0x84ce, 0x84cf, 0x84d0, 0x84d1, 0x84d2, 0x84d3, 0x84d4, 0x84d5, 0x84d6, 0x84d7, 0x84d8, 0x84d9, 0x84da, 0x84db,
  0x84dc, 0x84dd, 0x84de, 0x84df,
]

/**
 * @public
 */
export class TextureUnitStateGL extends TextureUnitState {
  /**
   * Gets the id of a texture unit by its index
   */
  public static textureUnitId(textureUnitIndex: number) {
    return TextureUnitMap[textureUnitIndex]
  }

  /**
   * Gets the texture unit id
   */
  public get unit(): number {
    return TextureUnitMap[this.index]
  }

  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  /**
   * The default sampler object
   */
  public readonly sampler: SamplerStateGL

  /**
   * Gets the 0-based texture unit index
   */
  public readonly index: number

  constructor(device: DeviceGL, index: number) {
    super()
    this.device = device
    this.index = index

    // HINT: constructor invocation to avoid reference counting
    // sampler state will be mutated and can not be shared
    this.sampler = new SamplerStateGL(device, SamplerState.Default)
  }

  /**
   * Binds the texture and sampler state to this texture unit.
   *
   * @remarks
   * The passed sampler is preferred over the sampler of the texture.
   */
  public commit(texture: Texture | TextureImage, sampler?: SamplerState): this {
    let image: TextureImage
    if (texture instanceof Texture) {
      sampler ||= texture.sampler
      image = texture.image
    } else {
      image = texture
    }
    sampler ||= this.sampler

    const gl = this.device.context as WebGL2RenderingContext
    const glTexture = image as TextureGL
    gl.activeTexture(this.unit)
    gl.bindTexture(glTexture.glType, glTexture.resource || null)
    gl.bindSampler(this.index, (sampler as SamplerStateGL).resource)

    return this
  }
}
