export class PooledList<T> {
  private pools: T[] = []
  private count = 0
  private factory: () => T
  public constructor(factory: () => T) {
    this.factory = factory
  }

  public push(item: T) {
    this.pools[this.count++] = item
  }

  public clear() {
    this.count = 0
  }

  public reset() {
    this.count = 0
  }

  public get size() {
    return this.count
  }

  public item(index: number): T {
    if (index < 0 || index >= this.count) {
      return null
    }
    return this.pools[index]
  }

  public next(): T {
    if (!this.factory) {
      throw new Error('No factory function provided for PooledList')
    }
    const item = this.nextAvailable() || this.factory()
    this.push(item)
    return item
  }

  public nextAvailable(): T | null {
    return this.item(this.count)
  }

  public toArray(target: T[] = []): T[] {
    target.length = this.count
    for (let i = 0; i < this.count; i++) {
      target[i] = this.pools[i]
    }
    return target
  }
}
