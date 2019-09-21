export type Primitive = string | number | boolean | bigint | symbol | undefined | null

export type Immutable<T> =
  T extends Primitive ? T :
  T extends Function ? T : // tslint:disable-line
  T extends Date ? T :
  T extends Map<infer K, infer V> ? ReadonlyMap<K, V> :
  T extends Set<infer U> ? ReadonlySet<U> :
  T extends {} ? { readonly [K1 in keyof T]: Immutable<T[K1]> } :
  Readonly<T>

interface ReadonlySet<ItemType> extends Set<Immutable<ItemType>> {}
interface ReadonlyMap<KeyType, ValueType> extends Map<Immutable<KeyType>, Immutable<ValueType>> {
  //
}
