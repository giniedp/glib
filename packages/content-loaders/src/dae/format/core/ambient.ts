import { COLLADA } from './collada'
import { mapChild, textContentToNumberArray } from './utils'

/**
 * Describes an ambient light source.
 */
export class Ambient {

  /**
   * Contains three floating-point numbers specifying the color of the light.
   */
  public get color(): number[] {
    return mapChild(this.el, 'color', textContentToNumberArray)
  }

  constructor(private doc: COLLADA, private el: Element) {

  }
}
