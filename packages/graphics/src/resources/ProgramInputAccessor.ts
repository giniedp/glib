import { ProgramInputs } from './ProgramInput'
import { Texture } from './Texture'

export type InputAccessor<Values extends ProgramInputs> = {
  get<K extends keyof Values, V = Values[K]>(name: K): V | null
  set<K extends keyof Values>(name: K, value: Values[K]): void
  dispose(): void
}

export function inputAccessor<Values extends ProgramInputs>(values: Values, target: any): InputAccessor<Values> {
  Object.defineProperty(target, 'get', {
    enumerable: false,
    value: function <K extends keyof Values, V = Values[K]>(name: K): V | null {
      return (values[name] as V) || null
    },
  })
  Object.defineProperty(target, 'set', {
    enumerable: false,
    value: function <K extends keyof Values>(name: K, value: Values[K]): void {
      if (values[name] === value) {
        return
      }
      const old = values[name]
      if (value instanceof Texture) {
        value.ref.retain()
      }
      if (old instanceof Texture) {
        old.ref.release()
      }
      values[name] = value
    },
  })
  Object.defineProperty(target, 'dispose', {
    enumerable: false,
    value: function (): void {
      for (const key in values) {
        const value = values[key]
        if (value instanceof Texture) {
          value.ref.release()
        }
      }
    },
  })
  return values as any
}

export type TypedInputAccessor<Values extends ProgramInputs> = ProgramInputs & InputAccessor<Values>

export function typedInputAccessor<Values extends ProgramInputs>(params: Values): TypedInputAccessor<Values> {
  return inputAccessor(params, params) as TypedInputAccessor<Values>
}
