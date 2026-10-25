import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import { tileRandom, tileRandomPrimitive } from '../lib/tiles'

/**
 * Which value of the tiles is returned
 * @public
 */
export type TilesOutput = 'checker' | 'edge' | 'random'

/**
 * Options of {@link tiles}. They change the generated code
 * @public
 */
export interface TilesOptions {
  /**
   * `checker` is `0` or `1` in alternating tiles, `edge` the distance to the nearest tile border in [0, 0.5],
   * `random` a random value in [0, 1) per tile. Defaults to `checker`
   */
  output?: TilesOutput
}

/**
 * Unit square tiles in the xy plane
 * @public
 */
export class TilesField extends Field {
  public readonly kind = 'tiles'
  public readonly output: TilesOutput

  public constructor(options?: TilesOptions) {
    super([])
    this.output = options?.output ?? 'checker'
  }

  public emit(ctx: EmitContext): string {
    const p = ctx.p
    switch (this.output) {
      case 'checker': {
        const sum = ctx.local('float', `floor(${p}.x) + floor(${p}.y)`, 'tile')
        return `(${sum} - 2.0 * floor(${sum} * 0.5))`
      }
      case 'edge': {
        const x = ctx.local('float', ctx.call('fract', `${p}.x`), 'fx')
        const y = ctx.local('float', ctx.call('fract', `${p}.y`), 'fy')
        return ctx.call('min', ctx.call('min', x, `1.0 - ${x}`), ctx.call('min', y, `1.0 - ${y}`))
      }
      case 'random':
        return ctx.call(ctx.use(tileRandomPrimitive), p)
    }
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    switch (this.output) {
      case 'checker': {
        const sum = ix + iy
        out[0] = sum - 2 * Math.floor(sum * 0.5)
        break
      }
      case 'edge': {
        const fx = x - ix
        const fy = y - iy
        out[0] = Math.min(Math.min(fx, 1 - fx), Math.min(fy, 1 - fy))
        break
      }
      case 'random':
        out[0] = tileRandom(x, y)
        break
    }
  }
}

/**
 * Unit square tiles: a checker pattern, the distance to the tile borders or a random value per tile.
 * Scale it for the number of tiles, an integer number of tiles per period stays seamless
 *
 * @public
 * @example
 * ```ts
 * // 4 x 4 tiles in [0, 1], dark grout lines
 * tiles({ output: 'edge' }).pipe(scale(4), smoothstep(0, 0.05))
 * ```
 */
export function tiles(options?: TilesOptions): Field {
  return new TilesField(options)
}
