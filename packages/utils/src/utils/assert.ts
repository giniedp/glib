import { Type } from '../types'

export function assertType<T extends Type<any>>(it: any, type: Type<T>): it is T {
  if (it instanceof type) {
    return true
  }
  throw new Error(`Expected type ${type.name}, but got ${it?.constructor?.name || typeof it}`)
}
