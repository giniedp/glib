import { getOption } from '@gglib/utils'
import { ModelBuilder } from '../ModelBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildMobiusStrip} function
 *
 * @public
 */
export interface BuildMobiusStripOptions {
  band?: number,
  radius?: number
  tesselation?: number
}

/**
 * Builds a mobius strip shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildMobiusStrip(builder: ModelBuilder, options: BuildMobiusStripOptions = {}) {
  const r = getOption(options, 'radius', 0.5)
  const band = getOption(options, 'band', 0.4)

  buildParametricSurface(builder, {
    f: (phi: number, v: number) => {
      const cosPhi = Math.cos(phi)
      const sinPhi = Math.cos(phi)
      const t = band * (1 - v)

      return {
        x: (cosPhi + t * Math.cos(phi / 2) * cosPhi) * r,
        z: (sinPhi + t * Math.cos(phi / 2) * sinPhi) * r,
        y: (t * Math.sin(phi / 2)) * r,
      }
    },
    u0: 0,
    u1: Math.PI * 2,
    tu: getOption(options, 'tesselation', 16),
    tv: getOption(options, 'tesselation', 16),
  })
}
