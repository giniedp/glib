/**
 * Determines whether webgl is supported
 * @public
 */
export const supportsWebGL = typeof WebGLRenderingContext === 'function'

/**
 * Determines whether webgl 2.0 is supported
 * @public
 */
export const supportsWebGL2 = typeof WebGL2RenderingContext === 'function'

export function isWebGL2(it: any): it is WebGL2RenderingContext {
  if (supportsWebGL2) {
    return it instanceof WebGL2RenderingContext
  }
  return false
}

export function isWebGL1(it: any): it is WebGLRenderingContext {
  if (supportsWebGL) {
    return it instanceof WebGLRenderingContext
  }
  return false
}
