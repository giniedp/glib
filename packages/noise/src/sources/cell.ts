import type { EmitContext } from '../emit/EmitContext'
import type { EvalContext } from '../evaluate'
import { Field } from '../Field'
import { cell3, type CellDistance, cellPrimitives, type CellResult } from '../lib/cell'

/**
 * Which distance of the cell noise is returned
 * @public
 */
export type CellOutput = 'f1' | 'f2' | 'f2-f1'

/**
 * Options of {@link cell}. Both change the generated code
 * @public
 */
export interface CellOptions {
  /**
   * Distance metric. Defaults to `euclidean`
   */
  distance?: CellDistance
  /**
   * `f1` is the distance to the nearest feature point, `f2` to the second nearest,
   * `f2-f1` gives cell borders. Defaults to `f1`
   */
  output?: CellOutput
}

interface Output {
  /**
   * Expression of the output, given the vec2 result `r` of the cell function (same in WGSL and GLSL)
   */
  emit: (r: string) => string
  cpu: (result: CellResult) => number
}

const OUTPUTS: Record<CellOutput, Output> = {
  f1: { emit: (r) => `${r}.x`, cpu: (it) => it.f1 },
  f2: { emit: (r) => `${r}.y`, cpu: (it) => it.f2 },
  'f2-f1': { emit: (r) => `(${r}.y - ${r}.x)`, cpu: (it) => it.f2 - it.f1 },
}

const result: CellResult = { f1: 0, f2: 0 }

/**
 * Cell (worley) noise field
 * @public
 */
export class CellField extends Field {
  public readonly kind = 'cell'
  public readonly distance: CellDistance
  public readonly output: CellOutput

  public constructor(options?: CellOptions) {
    super([])
    this.distance = options?.distance ?? 'euclidean'
    this.output = options?.output ?? 'f1'
  }

  public emit(ctx: EmitContext): string {
    const fn = ctx.use(cellPrimitives[this.distance])
    const r = ctx.local('vec2', ctx.call(fn, ctx.p), 'cell')
    return OUTPUTS[this.output].emit(r)
  }

  public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
    out[0] = OUTPUTS[this.output].cpu(cell3(x, y, z, this.distance, result))
  }
}

/**
 * Cell (worley) noise: distances to random feature points, one per unit cell
 * @public
 */
export function cell(options?: CellOptions): Field {
  return new CellField(options)
}
