
module Glib {

  export class Rect {
    public x: number
    public y: number
    public width: number
    public height: number

    constructor(x?: number, y?: number, width?: number, height?: number) {
      this.x = Math.floor(x)
      this.y = Math.floor(y)
      this.width = Math.floor(width)
      this.height = Math.floor(height)
    }

    /** Gets the left border of the rectangle */
    get left(): number {
      return this.x
    }
    /** Gets the top border of the rectangle */
    get top(): number{
      return this.y
    }
    /** Gets the right border of the rectangle */
    get right(): number {
      return this.x + this.width
    }
    /** Gets the bottom border of the rectangle */
    get bottom(): number {
      return this.y + this.height
    }

    public getTopLeft<T extends IPoint>(out?: T): T {
      out = out || new Vec2() as any
      out.x = this.x
      out.y = this.y
      return out
    }
    public getTopRight<T extends IPoint>(out?: T): T {
      out = out || new Vec2() as any
      out.x = this.x + this.width
      out.y = this.y
      return out
    }
    public getBottomLeft<T extends IPoint>(out?: T): T {
      out = out || new Vec2() as any
      out.x = this.x
      out.y = this.y + this.height
      return out
    }
    public getBottomRight<T extends IPoint>(out?: T): T {
      out = out || new Vec2() as any
      out.x = this.x + this.width
      out.y = this.y + this.height
      return out
    }
    public getCenter<T extends IPoint>(out?: T): T {
      out = out || new Vec2() as any
      out.x = this.x + this.width * 0.5
      out.y = this.y + this.height * 0.5
      return out
    }
    public setCenter(point?: IPoint) {
      this.x = point.x - this.width * 0.5
      this.y = point.y - this.height * 0.5
    }

    /** Checks whether the given coordinate is inside the rectangle */
    public containsXY(x: number, y: number): boolean {
      return this.left <= x && x < this.right && this.top <= y && y < this.bottom
    }

    /** Checks whether the given point is inside the rectangle */
    public contains(point: IPoint): boolean {
      return this.left <= point.x && point.x < this.right && this.top <= point.y && point.y < this.bottom
    }

    /** Checks whether the given rectangle is contained by this rectangle */
    public containsRect(r: Rect): boolean {
      return this.left <= r.left && r.right < this.right && this.top <= r.top && r.bottom < this.bottom
    }

    /** Checks whether the given rectangle intersects this rectangle */
    public intersects(r: Rect): boolean {
      return r.left < this.right && this.left < r.right && r.top < this.bottom && this.top < r.bottom
    }

    /** Inflates the rectangle by the double of the given amount */
    public inflate(horizontal: number, vertical: number) {
      this.x -= horizontal
      this.width += horizontal * 2
      this.y -= vertical
      this.height += vertical * 2
    }

    /** Adds an offset to this rectangle */
    public moveXY(offsetX: number, offsetY: number) {
      this.x += offsetX
      this.y += offsetY
    }

    /** Adds an offset to this rectangle */
    public move(offset: IPoint) {
      this.x += offset.x
      this.y += offset.y
    }

    /** Compares the given rectangle with this rectangle */
    public equals(other: Rect) {
      return this.x === other.x && this.y === other.y && this.width === other.width && this.height === other.height
    }

    /**
     * Calculates the intersection between two rectangles. If there is no intersection, an empty rectangle is returned.
     */
    public static intersect(rect1: Rect, rect2: Rect, out?: Rect): Rect {
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
}
