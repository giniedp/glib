export class ShaderUniformState<T extends number | boolean> {

  public get value() {
    return this.data
  }

  protected data: Array<T> = []

  public clear() {
    this.data.length = 0
  }

  public write(x: T): boolean {
    const data = this.data
    data.length = 1
    if (data[0] !== x) {
      data[0] = x
      return true
    }
    return false
  }

  public write2(x: T, y: T): boolean {
    let changed = false
    const data = this.data
    if (data[0] !== x) {
      data[0] = x
      changed = true
    }
    if (data[1] !== y) {
      data[1] = y
      changed = true
    }
    data.length = 2
    return changed
  }

  public write3(x: T, y: T, z: T): boolean {
    let changed = false
    const data = this.data
    if (data[0] !== x) {
      data[0] = x
      changed = true
    }
    if (data[1] !== y) {
      data[1] = y
      changed = true
    }
    if (data[2] !== z) {
      data[2] = z
      changed = true
    }
    data.length = 3
    return changed
  }

  public write4(x: T, y: T, z: T, w: T): boolean {
    let changed = false
    const data = this.data
    if (data[0] !== x) {
      data[0] = x
      changed = true
    }
    if (data[1] !== y) {
      data[1] = y
      changed = true
    }
    if (data[2] !== z) {
      data[2] = z
      changed = true
    }
    if (data[3] !== w) {
      data[3] = w
      changed = true
    }
    data.length = 4
    return changed
  }

}
