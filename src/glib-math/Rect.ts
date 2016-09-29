
module Glib
{
  
  export class Rect
  {
    x:number
    y:number
    width:number
    height:number

    constructor(x?:number, y?:number, width?:number, height?:number) {
      this.x = x|0
      this.y = y|0
      this.width = width|0
      this.height = height|0
    }

    /** Gets the left border of the rectangle */
    get left():number {
      return this.x
    }
    /** Gets the top border of the rectangle */
    get top():number{
      return this.y
    }
    /** Gets the right border of the rectangle */
    get right():number {
      return this.x + this.width
    }
    /** Gets the bottom border of the rectangle */
    get bottom():number {
      return this.y + this.height
    }

    getTopLeft<T extends IPoint>(out?:T): T {
      out = out || new Vec2() as any
      out.x = this.x
      out.y = this.y
      return out
    }
    getTopRight<T extends IPoint>(out?:T): T {
      out = out || new Vec2() as any
      out.x = this.x + this.width
      out.y = this.y
      return out
    }
    getBottomLeft<T extends IPoint>(out?:T): T {
      out = out || new Vec2() as any
      out.x = this.x
      out.y = this.y + this.height
      return out
    }
    getBottomRight<T extends IPoint>(out?:T): T {
      out = out || new Vec2() as any
      out.x = this.x + this.width
      out.y = this.y + this.height
      return out
    }
    getCenter<T extends IPoint>(out?:T): T {
      out = out || new Vec2() as any
      out.x = this.x + this.width * 0.5
      out.y = this.y + this.height * 0.5
      return out
    }
    setCenter(point?:IPoint) {
      this.x = point.x - this.width * 0.5
      this.y = point.y - this.height * 0.5
    }

    /** Checks whether the given coordinate is inside the rectangle */
    containsXY(x:number, y:number):boolean {
      return this.left <= x && x < this.right && this.top <= y && y < this.bottom
    }

    /** Checks whether the given point is inside the rectangle */
    contains(point:IPoint):boolean {
      return this.left <= point.x && point.x < this.right && this.top <= point.y && point.y < this.bottom
    }

    /** Checks whether the given rectangle is contained by this rectangle */
    containsRect(r:Rect):boolean{
      return this.left <= r.left && r.right < this.right && this.top <= r.top && r.bottom < this.bottom
    }

    /** Checks whether the given rectangle intersects this rectangle */
    intersects(r:Rect):boolean {
      return r.left < this.right && this.left < r.right && r.top < this.bottom && this.top < r.bottom
    }

    /** Inflates the rectangle by the double of the given amount */
    inflate(horizontal:number, vertical:number) {
      this.x -= horizontal
      this.width += horizontal * 2
      this.y -= vertical
      this.height += vertical * 2
    }

    /** Adds an offset to this rectangle */
    moveXY(offsetX:number, offsetY:number) {
      this.x += offsetX
      this.y += offsetY
    }

    /** Adds an offset to this rectangle */
    movie(offset:IPoint) {
      this.x += offset.x
      this.y += offset.y
    }

    /** Compares the given rectangle with this rectangle */
    equals(other:Rect) {
      return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height
    }

    /**
     * Calculates the intersection between two rectangles. If there is no intersection, an empty rectangle is returned.
     */
    static intersect(rect1:Rect, rect2:Rect, out?:Rect):Rect {
      out = out || new Rect()

      var t1 = rect1.x + rect1.width;
      var t2 = rect2.x + rect2.width;
      var rMin = t1 < t2 ? t1 : t2;

      t1 = rect1.y + rect1.height;
      t2 = rect2.y + rect2.height;
      var bMin = t1 < t2 ? t1 : t2;

      var xMax = rect1.x > rect2.x ? rect1.x : rect2.x;
      var yMax = rect1.y > rect2.y ? rect1.y : rect2.y;

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
    static union(rect1:Rect, rect2:Rect, out?:Rect):Rect {
      out = out || new Rect()
      var t1 = rect1.x + rect1.width
      var t2 = rect2.x + rect2.width
      var rightMax = t1 > t2 ? t1 : t2
      t1 = rect1.y + rect1.height
      t2 = rect2.y + rect2.height
      var bottomMax = (t1 > t2) ? t1 : t2

      var xMin = rect1.x < rect2.x ? rect1.x : rect2.x
      var yMin = rect1.y < rect2.y ? rect1.y : rect2.y

      out.x = xMin
      out.y = yMin
      out.width = rightMax - xMin
      out.height = bottomMax - yMin
      return out
    }
  }
}
