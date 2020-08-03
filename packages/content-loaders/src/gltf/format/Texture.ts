import { RootProperty } from './common'

/**
 * A texture and its sampler.
 */
export interface Texture extends RootProperty {
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
