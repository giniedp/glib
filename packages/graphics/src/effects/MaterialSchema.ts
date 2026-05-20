import { InputSlot, InputTypeMap } from '../resources'
import { Material } from './Material'

export type Key = string | number | symbol
export type MaterialSchema<S extends Record<Key, InputSlot>> = S
export type MaterialSchemaType<S extends Record<Key, InputSlot>> = {
  -readonly [K in keyof S]: S[K] extends InputSlot<infer T> ? InputTypeMap[T] : never
}

export function materialSchemaClass<S extends Record<Key, InputSlot>>(schema: S) {
  return class extends Material {
    constructor(...args: ConstructorParameters<typeof Material>) {
      super(...args)

      for (const key in schema) {
        const slot = schema[key]

        Object.defineProperty(this, key, {
          get: () => this.getInput(slot),
          set: (v) => this.setInput(slot, v),
        })
      }
    }
  } as new (...args: ConstructorParameters<typeof Material>) => Material & MaterialSchemaType<S>
}
