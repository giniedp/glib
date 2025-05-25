import { Property } from './common'

/**
 * Metadata about the glTF asset.
 */
export interface Asset extends Property {
  /**
   * A copyright message suitable for display to credit the content creator.
   */
  copyright?: string

  /**
   * Tool that generated this glTF model.  Useful for debugging.
   */
  generator?: string

  /**
   * The glTF version that this asset targets.
   */
  version: string

  /**
   * The minimum glTF version that this asset targets.
   */
  minVersion?: string
}
