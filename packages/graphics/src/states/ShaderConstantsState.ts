const STATE = Symbol('Shader Constants State')
const STATE_KEY = Symbol('Shader Constants Key')
const STATE_CACHE: Record<string, ShaderConstants> = {}

export class ShaderConstants {
  public static readonly Empty = ShaderConstants.cached({})

  private [STATE]: Record<string, number>

  public get state(): Readonly<Record<string, number>> {
    return this[STATE]
  }

  public get key(): string {
    return this[STATE_KEY]
  }

  private constructor(options: Record<string, number>, key: string) {
    this[STATE] = Object.freeze(options)
    this[STATE_KEY] = key
  }

  public static get(options: Record<string, number>): ShaderConstants {
    return ShaderConstants.cached(options)
  }

  private static cached(options: Record<string, number>): ShaderConstants {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new ShaderConstants(options, key)
      STATE_CACHE[key] = state
    }
    return state
  }
}

function createKey(state: Record<string, number>): string {
  if (!state) {
    return ''
  }
  const result: string[] = []
  for (const key in state) {
    result.push(`${key}:${state[key] ?? ''}`)
  }
  return result.sort().join(',')
}
