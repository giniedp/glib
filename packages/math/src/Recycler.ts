
export class Recycler<T> {
  private readonly pool: T[] = []
  private pointer = 0
  private depth = 0

  constructor(private cap = 20, private create: () => T) {
    for (let i = 0; i < cap; i++) {
      this.pool.push(create())
    }
  }

  public next(): T {
    let result
    if (this.pointer < this.cap) {
      result = this.pool[this.pointer]
      this.pointer++
      return result
    }
    result = this.pool[this.pointer] || this.create()
    this.pool[this.pointer] = result
    this.pointer++
    this.cap++
    return result
  }

  public begin() {
    this.depth++
  }

  public end<R>(toReturn?: R): R {
    this.depth--
    if (this.depth === 0) {
      this.pointer = 0
    } else if (this.depth < 0) {
      throw new Error('recycleEnd called too many times')
    }
    return toReturn
  }
}
