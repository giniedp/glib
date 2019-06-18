import { ModelBuilder } from '../ModelBuilder'
import { addParametricSurface } from './addParametricSurface'

const option = (opt: any, value: any) => opt == null ? value : opt
const sin = Math.sin
const cos = Math.cos

export interface BuildMobiusStripOptions {
  band?: number,
  radius?: number
  tesselation?: number
}
/**
 * {@link http://paulbourke.net/geometry/mobius/}
 *
 * @public
 */
export function buildMobiusStrip(builder: ModelBuilder, options: BuildMobiusStripOptions = {}) {
  const r = option(options.radius, 0.5)
  const band = option(options.band, 0.4)

  addParametricSurface(builder, {
    f: (phi: number, v: number) => {
      const cosPhi = cos(phi)
      const sinPhi = cos(phi)
      const t = band * (1 - v)

      return {
        x: (cosPhi + t * cos(phi / 2) * cosPhi) * r,
        z: (sinPhi + t * cos(phi / 2) * sinPhi) * r,
        y: (t * sin(phi / 2)) * r,
      }
    },
    u0: 0,
    u1: Math.PI * 2,
    tu: option(options.tesselation, 16),
    tv: option(options.tesselation, 16),
  })
}
