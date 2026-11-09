/**
 * A list that keeps its items when it is cleared, so they can be reused without allocation
 *
 * @remarks
 * {@link clear} only resets the size. {@link next} (with a factory) or {@link nextAvailable} hand out the item
 * that was at the next position before, a new one is created only when the list grows beyond its previous size.
 */
export class PooledList<T> {
  private pools: T[] = []
  private count = 0
  private factory: (() => T) | undefined
  public constructor(factory?: () => T) {
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

  /**
   * The item at the next position from before the last {@link clear}, null if there is none. Does not add it,
   * pass it to {@link push}.
   */
  public nextAvailable(): T | null {
    return this.count < this.pools.length ? this.pools[this.count] : null
  }

  public toArray(target: T[] = []): T[] {
    target.length = this.count
    for (let i = 0; i < this.count; i++) {
      target[i] = this.pools[i]
    }
    return target
  }
}
