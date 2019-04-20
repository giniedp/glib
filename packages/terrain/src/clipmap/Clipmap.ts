import { Device, Texture } from '@gglib/graphics'
import { IRect, Rect } from '@gglib/math'

function wrap(value: number, size: number): number {
  while (value < 0) {
    value += size
  }
  while (value > size) {
    value -= size
  }
  return value
}

const R1 = new Rect()
const R2 = new Rect()
const R3 = new Rect()

export class Clipmap {
  private elevationMap: Texture

  private density: number
  private originX: number
  private originY: number
  public readonly invalid: IRect[] = []

  public constructor(
    private device: Device,
    private level: number,
    private size: number,
  ) {
    this.density = Math.pow(2, level)
    this.elevationMap = device.createRenderTarget({
      width: size,
      height: size,
    })
  }

  public update(centerX: number, centerY: number) {
    // Snap the center of this level to the grid density
    // of the next coarser level. Math.Floor() is used to
    // achieve consistent snap behavior for negaitve and
    // positive coordinates.
    const d2 = this.density * 2
    const cX = Math.floor(centerX / d2) * d2 + this.density
    const cY = Math.floor(centerY / d2) * d2 + this.density

    const oX = this.originX
    const oY = this.originX

    this.originX = cX - Math.floor(this.size / 2) * this.density
    this.originY = cY - Math.floor(this.size / 2) * this.density

    if (oX == null || oY == null) {
      this.invalidate(this.originX, this.originY, this.size, this.size)
      return
    }

    this.invalidate(oX, 0, this.originX - oX, this.size)
    this.invalidate(0, oY, this.size, this.originY - oY)
  }

  public invalidate(x: number, y: number, width: number, height: number) {
    if (width < 0) {
      width = -width
      x -= width
    }
    if (height < 0) {
      height = -height
      y -= height
    }
    const size = this.size * this.density
    x = wrap(x, size)
    y = wrap(y, size)

    R1.x = 0
    R1.y = 0
    R1.width = size
    R1.height = size

    R2.x = x
    R2.y = y
    R2.width = width
    R2.height = height

    // INSIDE
    Rect.intersection(R1, R2, R3)
    if (R3.width && R3.height) {
      this.invalid.push({ x: R3.x, y: R3.y, width: R3.width, height: R3.height })
    }

    // wrap - RIGHT
    R1.x = size
    R1.y = 0
    Rect.intersection(R1, R2, R3)
    if (R3.width && R3.height) {
      this.invalid.push({ x: R3.x - size, y: R3.y, width: R3.width, height: R3.height })
    }

    // wrap - BOTTOM
    R1.x = 0
    R1.y = size
    Rect.intersection(R1, R2, R3)
    if (R3.width && R3.height) {
      this.invalid.push({ x: R3.x, y: R3.y - size, width: R3.width, height: R3.height })
    }

    // wrap - BOTTOM RIGHT
    R1.x = size
    R1.y = size
    Rect.intersection(R1, R2, R3)
    if (R3.width && R3.height) {
      this.invalid.push({ x: R3.x - size, y: R3.y - size, width: R3.width, height: R3.height })
    }
  }

  public clear() {
    this.invalid.length = 0
  }
}
