export type HeapNode<K, T> = {
  id: K
  priority: number
  order: number
  value: T
}

export class PriorityQueue<K, T> {
  private heap: HeapNode<K, T>[] = []
  private indexMap = new Map<K, number>()
  private orderCounter = 0

  public get entries(): ReadonlyArray<Readonly<HeapNode<K, T>>> {
    return this.heap
  }

  public size(): number {
    return this.heap.length
  }

  public has(id: K): boolean {
    return this.indexMap.has(id)
  }

  public peek(): T | undefined {
    return this.heap[0]?.value
  }

  public peekNode(): HeapNode<K, T> | undefined {
    return this.heap[0]
  }

  public push(id: K, priority: number, value: T) {
    if (this.indexMap.has(id)) {
      throw new Error(`Duplicate id: ${id}`)
    }

    const node: HeapNode<K, T> = {
      id,
      priority,
      order: this.orderCounter++,
      value,
    }

    this.heap.push(node)
    const index = this.heap.length - 1
    this.indexMap.set(id, index)

    this.bubbleUp(index)
  }

  public pop(): T | undefined {
    if (this.heap.length === 0) {
      return undefined
    }

    const root = this.heap[0]
    const last = this.heap.pop()!

    this.indexMap.delete(root.id)

    if (this.heap.length > 0) {
      this.heap[0] = last
      this.indexMap.set(last.id, 0)
      this.bubbleDown(0)
    }

    return root.value
  }

  public remove(id: K): boolean {
    const index = this.indexMap.get(id)
    if (index == null) {
      return false
    }

    const last = this.heap.pop()!
    this.indexMap.delete(id)

    if (index < this.heap.length) {
      this.heap[index] = last
      this.indexMap.set(last.id, index)

      // rebalance both directions
      if (!this.bubbleUp(index)) {
        this.bubbleDown(index)
      }
    }

    return true
  }

  public updatePriority(id: K, newPriority: number) {
    const index = this.indexMap.get(id)
    if (index == null) {
      return
    }

    const node = this.heap[index]
    const oldPriority = node.priority
    node.priority = newPriority

    if (newPriority < oldPriority) {
      this.bubbleUp(index)
    } else if (newPriority > oldPriority) {
      this.bubbleDown(index)
    }
  }

  public get(id: K): T | undefined {
    const index = this.indexMap.get(id)
    return index !== undefined ? this.heap[index].value : undefined
  }

  public clear() {
    this.heap = []
    this.indexMap.clear()
  }

  protected compare(a: HeapNode<K, T>, b: HeapNode<K, T>): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return a.order - b.order // stability
  }

  protected swap(i: number, j: number) {
    const tmp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = tmp

    this.indexMap.set(this.heap[i].id, i)
    this.indexMap.set(this.heap[j].id, j)
  }

  protected bubbleUp(index: number): boolean {
    let moved = false

    while (index > 0) {
      const parent = (index - 1) >> 1

      if (this.compare(this.heap[index], this.heap[parent]) < 0) {
        this.swap(index, parent)
        index = parent
        moved = true
      } else {
        break
      }
    }

    return moved
  }

  protected bubbleDown(index: number) {
    const length = this.heap.length

    while (true) {
      let smallest = index

      const left = index * 2 + 1
      const right = index * 2 + 2

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left
      }

      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right
      }

      if (smallest !== index) {
        this.swap(index, smallest)
        index = smallest
      } else {
        break
      }
    }
  }
}
