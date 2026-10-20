/**
 * A shader function that is emitted once when a field uses it, e.g. the perlin noise function
 *
 * @public
 * @remarks
 * Holds the same function in WGSL and GLSL ES 3.00. The CPU version is a plain TypeScript function next to it.
 */
export interface Primitive {
  /**
   * Name of the function in both languages
   */
  name: string
  /**
   * Primitives this one calls
   */
  deps?: Primitive[]
  wgsl: string
  glsl: string
}
