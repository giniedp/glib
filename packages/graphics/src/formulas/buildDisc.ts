import { Device } from '../Device'
import { Geometry } from '../model/Geometry'
import { beginGeometry, GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

export const BuildDiscDefaults = {
  offset: 0,
  outerRadius: 0.5,
  innerRadius: 0.25,
  tesselation: 32,
}

/**
 * Options for the {@link buildDisc} function
 *
 * @public
 */
export interface BuildDiscOptions {
  /**
   * The offset along the y axis
   */
  offset?: number
  /**
   * The outer radius
   */
  outerRadius?: number
  /**
   * The inner radius
   */
  innerRadius?: number
  /**
   * The tesselation
   */
  tesselation?: number
}

export function discGeometry(device: Device, options?: BuildDiscOptions): Geometry {
  return beginGeometry().append(buildDisc, options).endGeometry(device, {
    name: 'cap',
  })
}

/**
 * Builds a disc shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildDisc(builder: GeometryBuilder, options?: BuildDiscOptions) {
  const h = options?.offset ?? BuildDiscDefaults.offset
  const r1 = options?.outerRadius ?? BuildDiscDefaults.outerRadius
  const r2 = options?.innerRadius ?? BuildDiscDefaults.innerRadius
  const t = options?.tesselation ?? BuildDiscDefaults.tesselation

  buildParametricSurface(builder, {
    position: (u: number, v: number) => {
      return {
        x: v * Math.sin(u),
        y: h,
        z: v * Math.cos(u),
      }
    },
    normal: (u: number, v: number) => {
      return {
        x: 0,
        y: 1,
        z: 0,
      }
    },
    uSteps: t,
    vSteps: t,
    uStart: 0,
    uEnd: Math.PI * 2,
    vStart: r2,
    vEnd: r1,
  })
}
