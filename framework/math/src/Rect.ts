import { IVec2 } from './Types'
import { Vec2 } from './Vec2'

export class Rect {
  public x: number
  public y: number
  public width: number
  public height: number

  constructor(x?: number, y?: number, width?: number, height?: number) {
    this.x = x || 0
    this.y = y || 0
    this.width = width || 0
    this.height = height || 0
  }

  /**
   * Gets the left border of the rectangle
   */
  public get left(): number {
    return this.x
  }

  public set left(v: number) {
    this.x = v
  }

  /**
   * Gets the top border of the rectangle
   */
  public get top(): number{
    return this.y
  }

  public set top(v: number) {
    this.y = v
  }

  /**
   * Gets the right border of the rectangle
   */
  public get right(): number {
    return this.x + this.width
  }

  public set right(v: number) {
    this.width = v - this.x
  }

  /**
   * Gets the bottom border of the rectangle
   */
  public get bottom(): number {
    return this.y + this.height
  }

  public set bottom(v: number) {
    this.height = v - this.y
  }

  public floor(): Rect {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    this.width = Math.floor(this.width)
    this.height = Math.floor(this.height)
    return this
  }

  public ceil(): Rect {
    this.x = Math.ceil(this.x)
    this.y = Math.ceil(this.y)
    this.width = Math.ceil(this.width)
    this.height = Math.ceil(this.height)
    return this
  }

  public round(): Rect {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.width = Math.round(this.width)
    this.height = Math.round(this.height)
    return this
  }

  public getTopLeft<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.x
    out.y = this.y
    return out
  }
  public getTopRight<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.x + this.width
    out.y = this.y
    return out
  }
  public getBottomLeft<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.x
    out.y = this.y + this.height
    return out
  }
  public getBottomRight<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.x + this.width
    out.y = this.y + this.height
    return out
  }
  public getCenter<T extends IVec2 = Vec2>(out?: T|Vec2): T|Vec2 {
    out = out || new Vec2()
    out.x = this.x + this.width * 0.5
    out.y = this.y + this.height * 0.5
    return out
  }
  public setCenter(point: IVec2): Rect {
    this.x = point.x - this.width * 0.5
    this.y = point.y - this.height * 0.5
    return this
  }

  /**
   * Checks whether the given coordinate is inside the rectangle
   */
  public containsXY(x: number, y: number): boolean {
    return this.left <= x && x < this.right && this.top <= y && y < this.bottom
  }

  /**
   * Checks whether the given point is inside the rectangle
   */
  public contains(point: IVec2): boolean {
    return this.left <= point.x && point.x < this.right && this.top <= point.y && point.y < this.bottom
  }

  /**
   * Checks whether the given rectangle is contained by this rectangle
   */
  public containsRect(r: Rect): boolean {
    return this.left <= r.left && r.right <= this.right && this.top <= r.top && r.bottom <= this.bottom
  }

  /**
   * Checks whether the given rectangle intersects this rectangle
   */
  public intersects(r: Rect): boolean {
    return r.left < this.right && this.left < r.right && r.top < this.bottom && this.top < r.bottom
  }

  /**
   * Checks whether two rectangles do intersect
   */
  public static intersects(r1: Rect, r2: Rect): boolean {
    return r2.left < r1.right && r1.left < r2.right && r2.top < r1.bottom && r1.top < r2.bottom
  }

  /**
   * Inflates the rectangle by the double of the given amount
   */
  public inflate(horizontal: number, vertical: number): Rect {
    this.x -= horizontal
    this.width += horizontal * 2
    this.y -= vertical
    this.height += vertical * 2
    return this
  }

  /**
   * Adds an offset to this rectangle
   */
  public moveXY(offsetX: number, offsetY: number): Rect {
    this.x += offsetX
    this.y += offsetY
    return this
  }

  /**
   * Adds an offset to this rectangle
   */
  public move(offset: IVec2): Rect {
    this.x += offset.x
    this.y += offset.y
    return this
  }

  /**
   * Compares the given rectangle with this rectangle
   */
  public equals(other: Rect) {
    return this.x === other.x && this.y === other.y && this.width === other.width && this.height === other.height
  }

  /**
   * Calculates the intersection between two rectangles. If there is no intersection, an empty rectangle is returned.
   */
  public static intersection(rect1: Rect, rect2: Rect, out?: Rect): Rect {
    out = out || new Rect()

    let t1 = rect1.x + rect1.width
    let t2 = rect2.x + rect2.width
    const rMin = t1 < t2 ? t1 : t2

    t1 = rect1.y + rect1.height
    t2 = rect2.y + rect2.height
    const bMin = t1 < t2 ? t1 : t2

    const xMax = rect1.x > rect2.x ? rect1.x : rect2.x
    const yMax = rect1.y > rect2.y ? rect1.y : rect2.y

    if (xMax < rMin && yMax < bMin) {
      out.x = xMax
      out.y = yMax
      out.width = rMin - xMax
      out.height = bMin - yMax
    } else {
      out.x = 0
      out.y = 0
      out.width = 0
      out.height = 0
    }
    return out
  }

  /**
   * Calculates the union of two rectangles
   */
  public static union(rect1: Rect, rect2: Rect, out?: Rect): Rect {
    out = out || new Rect()
    let t1 = rect1.x + rect1.width
    let t2 = rect2.x + rect2.width
    const rightMax = t1 > t2 ? t1 : t2
    t1 = rect1.y + rect1.height
    t2 = rect2.y + rect2.height
    const bottomMax = (t1 > t2) ? t1 : t2

    const xMin = rect1.x < rect2.x ? rect1.x : rect2.x
    const yMin = rect1.y < rect2.y ? rect1.y : rect2.y

    out.x = xMin
    out.y = yMin
    out.width = rightMax - xMin
    out.height = bottomMax - yMin
    return out
  }
}
