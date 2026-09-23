import { InputSlot, InputTypeMap } from '../resources'
import { Material } from './Material'

export type Key = string | number | symbol
export type MaterialSchema<S extends Record<Key, InputSlot>> = S
export type MaterialSchemaType<S extends Record<Key, InputSlot>> = {
  -readonly [K in keyof S]: S[K] extends InputSlot<infer T> ? InputTypeMap[T] : never
}

export function MaterialWithSchema<S extends Record<Key, InputSlot>>(schema: S) {
  const SchemaClass = class extends Material {}

  for (const key in schema) {
    const slot = schema[key]

    Object.defineProperty(SchemaClass.prototype, key, {
      get() {
        return (this as Material).getInput(slot)
      },
      set(v) {
        return (this as Material).setInput(slot, v)
      },
    })
  }

  return SchemaClass as new (
    ...args: ConstructorParameters<typeof Material>
  ) => Material & MaterialSchemaType<S> & { schema: S }
}
