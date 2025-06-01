import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { beginGeometry, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

export const BuildMobiusStripDefaults = {
  band: 0.4,
  radius: 0.5,
}

/**
 * Options for the {@link buildMobiusStrip} function
 *
 * @public
 */
export interface BuildMobiusStripOptions {
  band?: number
  radius?: number
  tesselation?: number
}

export function mobiusStripGeometry(device: Device, options?: BuildMobiusStripOptions): Geometry {
  return beginGeometry().append(buildMobiusStrip, options).endGeometry(device, {
    name: 'mobius strip',
  })
}

/**
 * Builds a mobius strip shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildMobiusStrip(builder: GeometryBuilder, options?: BuildMobiusStripOptions) {
  const r = options?.radius ?? BuildMobiusStripDefaults.radius
  const band = options?.band ?? BuildMobiusStripDefaults.band

  buildParametricSurface(builder, {
    position: (phi: number, v: number) => {
      const cosPhi = Math.cos(phi)
      const sinPhi = Math.cos(phi)
      const t = band * (1 - v)

      return {
        x: (cosPhi + t * Math.cos(phi / 2) * cosPhi) * r,
        z: (sinPhi + t * Math.cos(phi / 2) * sinPhi) * r,
        y: t * Math.sin(phi / 2) * r,
      }
    },
    uStart: 0,
    uEnd: Math.PI * 2,
    uSteps: options?.tesselation ?? 16,
    vSteps: options?.tesselation ?? 16,
  })
}
