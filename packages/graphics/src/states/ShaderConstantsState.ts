const STATE = Symbol('Shader Constants State')
const STATE_CACHE: Record<string, ShaderConstants> = {}

export class ShaderConstants {
  public static readonly Empty = ShaderConstants.cached({})

  private [STATE]: Record<string, number>

  public get state(): Readonly<Record<string, number>> {
    return this[STATE]
  }

  private constructor(options: Record<string, number>) {
    this[STATE] = Object.freeze(options)
  }

  public static get(options: Record<string, number>): ShaderConstants {
    return ShaderConstants.cached(options)
  }

  private static cached(options: Record<string, number>): ShaderConstants {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new ShaderConstants(options)
      STATE_CACHE[key] = state
    }
    return state
  }
}

function createKey(state: Record<string, number | string>): string {
  if (!state) {
    return ''
  }
  const result: string[] = []
  for (const key in state) {
    result.push(`${key}:${state[key] ?? ''}`)
  }
  return result.sort().join(',')
}
