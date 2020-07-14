import { isString } from './string'

/**
 * Gets a canvas element by a CSS selector or creates a new instance of HTMLCanvasElement
 *
 * @public
 */
export function getOrCreateCanvas(canvas?: string | HTMLCanvasElement): HTMLCanvasElement {
  if (canvas instanceof HTMLCanvasElement) {
    return canvas
  }
  if (isString(canvas)) {
    const element = document.getElementById(canvas as string) || document.querySelector(canvas as string)
    if (element instanceof HTMLCanvasElement) {
      return element
    } else {
      throw new Error(`expected '${canvas}' to select a HTMLCanvasElement but got '${element}'`)
    }
  }
  return document.createElement('canvas') as HTMLCanvasElement
}
