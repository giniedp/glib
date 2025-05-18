import type { GeometryBuilder, GeometryBuilderFunction } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildSphere} function
 *
 * @public
 */
export interface BuildSphereOptions {
  /**
   * The sphere radius
   */
  radius?: number
  /**
   * The tesselation
   */
  tesselation?: number
}

export function sphereBuilder(options: BuildSphereOptions = {}): GeometryBuilderFunction<void> {
  return (builder: GeometryBuilder) => buildSphere(builder, options)
}

/**
 * Builds a sphere shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildSphere(builder: GeometryBuilder, options: BuildSphereOptions = {}) {
  const r = options?.radius ?? 0.5

  buildParametricSurface(builder, {
    f: (phi: number, theta: number) => {
      return {
        x: r * Math.sin(theta) * Math.sin(phi),
        y: r * Math.cos(theta),
        z: r * Math.sin(theta) * Math.cos(phi),
      }
    },
    n: (phi: number, theta: number) => {
      return {
        x: Math.sin(theta) * Math.sin(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.cos(phi),
      }
    },
    tu: options?.tesselation ?? 32,
    tv: options?.tesselation ?? 32,
    u0: 0,
    u1: Math.PI * 2,
    v0: 0,
    v1: Math.PI,
  })
}
