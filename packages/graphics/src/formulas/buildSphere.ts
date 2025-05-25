import { Device } from '../Device'
import { Geometry } from '../model/Geometry'
import { beginGeometry, GeometryBuilder, GeometryBuilderFunction } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

export const BuildSphereDefaults = {
  radius: 0.5,
  tesselation: 32,
}

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

export function sphereGeometry(device: Device, options?: BuildSphereOptions): Geometry {
  return beginGeometry().append(buildSphere, options).endGeometry(device, {
    name: 'sphere',
  })
}

/**
 * Builds a sphere shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildSphere(builder: GeometryBuilder, options: BuildSphereOptions = {}) {
  const r = options?.radius ?? BuildSphereDefaults.radius
  const t = options?.tesselation ?? BuildSphereDefaults.tesselation
  buildParametricSurface(builder, {
    position: (phi: number, theta: number) => {
      return {
        x: r * Math.sin(theta) * Math.sin(phi),
        y: r * Math.cos(theta),
        z: r * Math.sin(theta) * Math.cos(phi),
      }
    },
    normal: (phi: number, theta: number) => {
      return {
        x: Math.sin(theta) * Math.sin(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.cos(phi),
      }
    },
    uSteps: t,
    vSteps: t,
    uStart: 0,
    uEnd: Math.PI * 2,
    vStart: 0,
    vEnd: Math.PI,
  })
}
