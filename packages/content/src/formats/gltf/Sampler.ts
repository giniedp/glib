import { RootProperty } from './common'

/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export interface Sampler extends RootProperty {
  /**
   * Magnification filter.
   *
   * @remarks
   * Magnification filter.  Valid values correspond to WebGL enums: `9728` (NEAREST) and `9729` (LINEAR).
   */
  magFilter?: number

  /**
   * Minification filter.
   *
   * @remarks
   * Minification filter.  All valid values correspond to WebGL enums.
   */
  minFilter?: number

  /**
   * s wrapping mode.
   *
   * @remarks
   * S (U) wrapping mode.  All valid values correspond to WebGL enums
   */
  wrapS?: number

  /**
   * t wrapping mode.
   *
   * @remarks
   * T (V) wrapping mode.  All valid values correspond to WebGL enums.
   */
  wrapT?: number
}
