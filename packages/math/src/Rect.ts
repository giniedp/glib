import { IRect, IVec2 } from './Types'
import { Vec2 } from './Vec2'

/**
 * A rectangle.
 *
 * @public
 */
export class Rect {
  public x: number
  public y: number
  public width: number
  public height: number

  /**
   * Constructs a new instance of {@link Rect}
   */
  constructor(x?: number, y?: number, width?: number, height?: number) {
    this.x = x || 0
    this.y = y || 0
    this.width = width || 0
    this.height = height || 0
  }

  /**
   * Gets the value of `x + width`
   *
   * @remarks
   * On set, the `width` of the rectangle is unchanged
   * but instead the `x` position is adjusted
   */
  public get xEnd(): number {
    return this.x + this.width
  }

  public set xEnd(v: number) {
    this.x = v - this.width
  }

  /**
   * Gets the value of `y + height`
   *
   * @remarks
   * On set, the `height` of the rectangle is unchanged
   * but instead the `y` position is adjusted
   */
  public get yEnd(): number {
    return this.y + this.height
  }
  public set yEnd(v: number) {
    this.y = v - this.height
  }

  public get centerX() {
    return this.x + this.width * 0.5
  }

  public get centerY() {
    return this.y + this.height * 0.5
  }

  /**
   * calls `Math.floor` for each component
   */
  public floor(): this {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    this.width = Math.floor(this.width)
    this.height = Math.floor(this.height)
    return this
  }

  /**
   * calls `Math.ceil` for each component
   */
  public ceil(): this {
    this.x = Math.ceil(this.x)
    this.y = Math.ceil(this.y)
    this.width = Math.ceil(this.width)
    this.height = Math.ceil(this.height)
    return this
  }

  /**
   * calls `Math.round` for each component
   */
  public round(): this {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.width = Math.round(this.width)
    this.height = Math.round(this.height)
    return this
  }

  public getTopLeft(): Vec2
  public getTopLeft<T>(out?: T): T & IVec2
  public getTopLeft(out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = this.x
    out.y = this.y
    return out
  }

  public getTopRight(): Vec2
  public getTopRight<T>(out?: T): T & IVec2
  public getTopRight(out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = this.x + this.width
    out.y = this.y
    return out
  }

  public getBottomLeft(): Vec2
  public getBottomLeft<T>(out?: T): T & IVec2
  public getBottomLeft(out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = this.x
    out.y = this.y + this.height
    return out
  }

  public getBottomRight(): Vec2
  public getBottomRight<T>(out?: T): T & IVec2
  public getBottomRight(out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = this.x + this.width
    out.y = this.y + this.height
    return out
  }

  public getCenter(): Vec2
  public getCenter<T>(out?: T): T & IVec2
  public getCenter(out?: IVec2): IVec2 {
    out = out || new Vec2()
    out.x = this.x + this.width * 0.5
    out.y = this.y + this.height * 0.5
    return out
  }

  public setCenter(point: IVec2): this {
    this.x = point.x - this.width * 0.5
    this.y = point.y - this.height * 0.5
    return this
  }

  public getX(t: number) {
    return this.x + this.width * t
  }

  public getY(t: number) {
    return this.y + this.height * t
  }

  /**
   * Checks whether the given coordinate is inside the rectangle
   */
  public containsXY(x: number, y: number): boolean {
    return this.x <= x && x < this.xEnd && this.y <= y && y < this.yEnd
  }

  /**
   * Checks whether the given point is inside the rectangle
   */
  public contains(point: IVec2): boolean {
    return this.x <= point.x && point.x < this.xEnd && this.y <= point.y && point.y < this.yEnd
  }

  /**
   * Checks whether the given rectangle is contained by this rectangle
   */
  public containsRect(r: Rect): boolean {
    return this.x <= r.x && r.xEnd <= this.xEnd && this.y <= r.y && r.yEnd <= this.yEnd
  }

  /**
   * Checks whether the given rectangle intersects this rectangle
   */
  public intersects(r: Rect): boolean {
    return r.x < this.xEnd && this.x < r.xEnd && r.y < this.yEnd && this.y < r.yEnd
  }

  /**
   * Checks whether two rectangles do intersect
   */
  public static intersects(r1: Rect, r2: Rect): boolean {
    return r2.x < r1.xEnd && r1.x < r2.xEnd && r2.y < r1.yEnd && r1.y < r2.yEnd
  }

  /**
   * Inflates the rectangle by the double of the given amount
   */
  public inflate(horizontal: number, vertical: number): this {
    this.x -= horizontal
    this.width += horizontal * 2
    this.y -= vertical
    this.height += vertical * 2
    return this
  }

  /**
   * Adds an offset to this rectangle
   */
  public moveXY(offsetX: number, offsetY: number): this {
    this.x += offsetX
    this.y += offsetY
    return this
  }

  /**
   * Adds an offset to this rectangle
   */
  public move(offset: IVec2): this {
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
  public static intersection(rect1: IRect, rect2: IRect): Rect
  public static intersection<T>(rect1: IRect, rect2: IRect, out?: T): T & IRect
  public static intersection(rect1: IRect, rect2: IRect, out?: IRect): IRect {
    out = out || new Rect() as any

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
  public static union<T extends IRect = IRect>(rect1: IRect, rect2: IRect, out?: T): T {
    out = out || new Rect() as any

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
