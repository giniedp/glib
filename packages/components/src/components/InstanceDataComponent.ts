import { GameComponent, GameEntity } from '@gglib/ecs'

export interface InstanceDataComponentOptions {
  data: Float32Array<ArrayBuffer>
}

export class InstanceDataComponent implements GameComponent {
  public readonly entity: GameEntity
  public data: Float32Array<ArrayBuffer>
  public constructor(options?: InstanceDataComponentOptions) {
    this.data = options?.data ?? new Float32Array(16)
  }

  public writeRow0(x: number, y?: number, z?: number, w?: number) {
    this.writeRow(0, x, y, z, w)
  }

  public writeRow1(x: number, y?: number, z?: number, w?: number) {
    this.writeRow(1, x, y, z, w)
  }

  public writeRow2(x: number, y?: number, z?: number, w?: number) {
    this.writeRow(2, x, y, z, w)
  }

  public writeRow3(x: number, y?: number, z?: number, w?: number) {
    this.writeRow(3, x, y, z, w)
  }

  private writeRow(index: number, x: number, y?: number, z?: number, w?: number) {
    const offset = index * 4
    this.data[offset + 0] = x
    this.data[offset + 1] = y ?? this.data[offset + 1]
    this.data[offset + 2] = z ?? this.data[offset + 2]
    this.data[offset + 3] = w ?? this.data[offset + 3]
  }
}
