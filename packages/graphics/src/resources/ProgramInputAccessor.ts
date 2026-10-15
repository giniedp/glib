import { InputValueType } from './ProgramInput'

export type InputAccessor<Values extends Record<string, InputValueType>> = {
  get<K extends keyof Values, V = Values[K]>(name: K): V | null
  set<K extends keyof Values>(name: K, value: Values[K]): void
}

export function inputAccessor<Values extends Record<string, InputValueType>>(
  values: Values,
  target: any,
): InputAccessor<Values> {
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
      values[name] = value
    },
  })
  return values as any
}

export type TypedInputAccessor<Values extends Record<string, InputValueType>> = Record<string, InputValueType> &
  InputAccessor<Values>

export function typedInputAccessor<Values extends Record<string, InputValueType>>(
  params: Values,
): TypedInputAccessor<Values> {
  return inputAccessor(params, params) as TypedInputAccessor<Values>
}
