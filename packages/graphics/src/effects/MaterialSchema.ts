import { ProgramInputs } from '../resources'
import { Material } from './Material'

export type Key = string | number | symbol
export type PropertyAlias<K extends Key, T> = K & { __type: T }
export type MaterialSchemaType<Values, Schema extends Record<string, keyof Values>> = {
  [K in keyof Schema]: Values[Schema[K]]
}

export type MaterialSchema<Values extends ProgramInputs, Schema extends Record<Key, keyof Values>> = {
  [K in keyof Schema]: PropertyAlias<Schema[K], Values[Schema[K]]>
}

export function materialSchema<V extends ProgramInputs>() {
  return <S extends Record<Key, keyof V>>(schema: S): MaterialSchema<V, S> => {
    return schema as unknown as MaterialSchema<V, S>
  }
}
export function materialSchemaClass<Values extends ProgramInputs, Schema extends Record<Key, keyof Values>>(
  schema: MaterialSchema<Values, Schema>,
) {
  return class extends Material<Values> {
    constructor(...args: ConstructorParameters<typeof Material<Values>>) {
      super(...args)

      for (const key in schema) {
        const path = schema[key]

        Object.defineProperty(this, key, {
          get: () => this.get(path),
          set: (v) => this.set(path, v),
        })
      }
    }
  } as new (
    ...args: ConstructorParameters<typeof Material<Values>>
  ) => Material<Values> & MaterialSchemaType<Values, Schema>
}
