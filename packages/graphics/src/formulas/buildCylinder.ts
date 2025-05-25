import { Device } from '../Device'
import { Geometry } from '../model/Geometry'
import { beginGeometry, type GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 *
 */
export const CylinderDefaults = {
  height: 1.0,
  offset: -0.5,
  radius: 0.5,
  tesselation: 32,
}

/**
 * Options for the {@link buildCylinder} function
 *
 * @public
 */
export interface BuildCylinderOptions {
  /**
   * The height of the cylinder. Defaults to `1.0`.
   */
  height?: number
  /**
   * The offset along the y axis. Defaults to `-0.5`.
   */
  offset?: number
  /**
   * Radius of the cylinder. Defaults to `0.5`.
   */
  radius?: number
  /**
   * The tesselation. Defaults to `32`.
   */
  tesselation?: number
}

export function cylinderGeometry(device: Device, options?: BuildCylinderOptions): Geometry {
  return beginGeometry().append(buildCylinder, options).endGeometry(device, {
    name: 'cylinder',
  })
}

/**
 * Builds a cylinder shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCylinder(builder: GeometryBuilder, options?: BuildCylinderOptions) {
  const r = options?.radius ?? CylinderDefaults.radius
  const h = options?.height ?? CylinderDefaults.height
  const o = options?.offset ?? CylinderDefaults.offset
  const t = options?.tesselation ?? CylinderDefaults.tesselation
  buildParametricSurface(builder, {
    position: (u: number, v: number) => {
      return {
        x: r * Math.sin(u),
        y: v,
        z: r * Math.cos(u),
      }
    },
    normal: (u: number, v: number) => {
      return {
        x: Math.sin(u),
        y: 0,
        z: Math.cos(u),
      }
    },
    uSteps: t,
    vSteps: t,
    uStart: 0,
    uEnd: Math.PI * 2,
    vStart: o + h,
    vEnd: o,
  })
}
