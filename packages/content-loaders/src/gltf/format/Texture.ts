import { GLTFRootProperty } from './common'

/**
 * A texture and its sampler.
 */
export interface GLTFTexture extends GLTFRootProperty {
  /**
   * The index of the sampler used by this texture. When undefined,
   * a sampler with repeat wrapping and auto filtering should be used.
   */
  sampler?: number

  /**
   * The index of the image used by this texture.
   */
  source?: number
}
