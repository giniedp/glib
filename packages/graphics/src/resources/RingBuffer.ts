export abstract class RingBuffer<T, D> {
  /**
   * The buffer data
   */
  public abstract readonly data: D

  /**
   * The capacity of the buffer in number of instaces of T (not bytes)
   */
  public abstract readonly capacity: number

  /**
   * The stride size in bytes
   */
  public abstract readonly strideInBytes: number

  private index = 0
  public get instanceOffset(): number {
    return this.index
  }
  public set instanceOffset(value: number) {
    this.index = value % this.capacity
  }
  public get byteOffset(): number {
    return this.index * this.strideInBytes
  }
  public get sizeInBytes(): number {
    return this.capacity * this.strideInBytes
  }

  public push(value: T): void {
    if (this.index >= this.capacity) {
      this.index = 0
    }
    this.write(value)
    this.index++
  }

  /**
   * Resets the buffer index to 0, allowing the next write to start from the beginning of the buffer.
   * This does not clear the buffer data, so any unwritten instances will still contain their previous values until overwritten.
   */
  public reset(): void {
    this.index = 0
  }

  /**
   * Returns the number of contiguous instances that can be written to the buffer without wrapping around
   *
   * @param count - the number of instances to write
   * @returns the number of instances that can be written contiguously
   */
  public remainingContiguous(count: number): number {
    return Math.min(count, this.capacity - this.index)
  }

  protected abstract write(value: T): void
}
