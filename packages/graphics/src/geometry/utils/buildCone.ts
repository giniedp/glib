import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { beginGeometry, buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

export const BuildConeDefaults = {
  height: 1.0,
  upperRadius: 0.0,
  lowerRadius: 0.5,
  tesselation: 32,
}

/**
 * Options for the {@link buildCone} function
 *
 * @public
 */
export interface BuildConeOptions {
  /**
   * The height of the cone
   * @remarks
   * defaults to `1.0`
   */
  height?: number
  /**
   * The bottom radius of the cone
   * @remarks
   * defaults to `0.5`
   */
  lowerRadius?: number
  /**
   * The top radius of the cone
   * @remarks
   * defaults to `0.0`
   */
  upperRadius?: number
  /**
   * The tesselation factor
   */
  tesselation?: number
}

export function coneGeometry(device: Device, options?: BuildConeOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildCone, {
    name: 'Cone',
    ...(options || {}),
  })
}

/**
 * Builds a cone shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCone(builder: GeometryBuilder, options?: BuildConeOptions) {
  const r1 = options?.lowerRadius ?? BuildConeDefaults.lowerRadius
  const r2 = options?.upperRadius ?? BuildConeDefaults.upperRadius
  const h = options?.height ?? BuildConeDefaults.height
  const t = options?.tesselation ?? BuildConeDefaults.tesselation

  buildParametricSurface(builder, {
    position: (u: number, v: number) => {
      u = 1 - u
      v = 1 - v
      const s = (h - v * h) / h
      const r = r1 * s + r2 * (1 - s)
      return {
        x: r * Math.cos(Math.PI * 2 * u),
        y: v * h,
        z: r * Math.sin(Math.PI * 2 * u),
      }
    },
    uSteps: t,
    vSteps: t,
  })
}
