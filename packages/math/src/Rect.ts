import type { IRect, IVec2 } from './Types'
import { vec2 } from './Vec2'

/**
 * Creates a new rectangle
 *
 * @param x The x position. Defaults to 0.
 * @param y The y position. Defaults to 0.
 * @param width The width. Defaults to 0.
 * @param height The height. Defaults to 0.
 */
export function rect(x?: number, y?: number, width?: number, height?: number): IRect {
  return {
    x: x ?? 0,
    y: y ?? 0,
    width: width ?? 0,
    height: height ?? 0,
  }
}

/**
 * Sets the components of a rectangle
 *
 * @param out The rectangle to set
 * @param x The x position
 * @param y The y position
 * @param width The width
 * @param height The height
 */
export function rect$init(out: IRect, x: number, y: number, width: number, height: number): IRect {
  out.x = x
  out.y = y
  out.width = width
  out.height = height
  return out
}

/**
 * Copies the components of another rectangle into a rectangle
 *
 * @param out The rectangle to set
 * @param other The rectangle to copy from
 */
export function rect$initFrom(out: IRect, other: IRect): IRect {
  return rect$init(out, other.x, other.y, other.width, other.height)
}

/**
 * Copies a rectangle
 *
 * @param r The rectangle to copy
 * @param out The rectangle to write to.
 */
export function rectCopy(r: IRect, out?: IRect): IRect {
  return rect$initFrom(out || rect(), r)
}

/**
 * Checks if two rectangles have equal components
 *
 * @param a The first rectangle
 * @param b The second rectangle
 */
export function rectEquals(a: IRect, b: IRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

/**
 * Gets the x coordinate at a relative position inside the rectangle
 *
 * @param r The rectangle
 * @param u The relative position on the x axis. 0 is the left edge, 1 is the right edge.
 */
export function rectGetX(r: IRect, u: number): number {
  return r.x + r.width * u
}

/**
 * Gets the y coordinate at a relative position inside the rectangle
 *
 * @param r The rectangle
 * @param v The relative position on the y axis. 0 is the top edge, 1 is the bottom edge.
 */
export function rectGetY(r: IRect, v: number): number {
  return r.y + r.height * v
}

/**
 * Gets the point at a relative position inside the rectangle
 *
 * @remarks
 * `(0, 0)` is the top left corner, `(1, 1)` the bottom right corner and `(0.5, 0.5)` the center.
 *
 * @param r The rectangle
 * @param u The relative position on the x axis
 * @param v The relative position on the y axis
 * @param out The vector to write to.
 */
export function rectGetPoint(r: IRect, u: number, v: number, out?: IVec2): IVec2 {
  out ||= vec2()
  out.x = r.x + r.width * u
  out.y = r.y + r.height * v
  return out
}

/**
 * Moves a rectangle so that its center is at the given point. The size is unchanged.
 *
 * @param out The rectangle to move
 * @param point The new center
 */
export function rect$setCenter(out: IRect, point: IVec2): IRect {
  out.x = point.x - out.width * 0.5
  out.y = point.y - out.height * 0.5
  return out
}

/**
 * Calls `Math.floor` on each component of a rectangle
 *
 * @param out The rectangle to change
 */
export function rect$floor(out: IRect): IRect {
  return rectFloor(out, out)
}

/**
 * Calls `Math.floor` on each component of a rectangle
 *
 * @param r The rectangle
 * @param out The rectangle to write to.
 */
export function rectFloor(r: IRect, out?: IRect): IRect {
  return rect$init(out || rect(), Math.floor(r.x), Math.floor(r.y), Math.floor(r.width), Math.floor(r.height))
}

/**
 * Calls `Math.ceil` on each component of a rectangle
 *
 * @param out The rectangle to change
 */
export function rect$ceil(out: IRect): IRect {
  return rectCeil(out, out)
}

/**
 * Calls `Math.ceil` on each component of a rectangle
 *
 * @param r The rectangle
 * @param out The rectangle to write to.
 */
export function rectCeil(r: IRect, out?: IRect): IRect {
  return rect$init(out || rect(), Math.ceil(r.x), Math.ceil(r.y), Math.ceil(r.width), Math.ceil(r.height))
}

/**
 * Calls `Math.round` on each component of a rectangle
 *
 * @param out The rectangle to change
 */
export function rect$round(out: IRect): IRect {
  return rectRound(out, out)
}

/**
 * Calls `Math.round` on each component of a rectangle
 *
 * @param r The rectangle
 * @param out The rectangle to write to.
 */
export function rectRound(r: IRect, out?: IRect): IRect {
  return rect$init(out || rect(), Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height))
}

/**
 * Grows a rectangle on each side. The width grows by twice `horizontal` and the height by twice `vertical`.
 *
 * @param out The rectangle to change
 * @param horizontal The amount to add on the left and on the right
 * @param vertical The amount to add on the top and on the bottom
 */
export function rect$inflate(out: IRect, horizontal: number, vertical: number): IRect {
  return rectInflate(out, horizontal, vertical, out)
}

/**
 * Grows a rectangle on each side. The width grows by twice `horizontal` and the height by twice `vertical`.
 *
 * @param r The rectangle
 * @param horizontal The amount to add on the left and on the right
 * @param vertical The amount to add on the top and on the bottom
 * @param out The rectangle to write to.
 */
export function rectInflate(r: IRect, horizontal: number, vertical: number, out?: IRect): IRect {
  return rect$init(out || rect(), r.x - horizontal, r.y - vertical, r.width + horizontal * 2, r.height + vertical * 2)
}

/**
 * Checks if a point is inside a rectangle
 *
 * @remarks
 * The left and top edges are inside, the right and bottom edges are outside.
 *
 * @param r The rectangle
 * @param point The point
 */
export function rectContains(r: IRect, point: IVec2): boolean {
  return rectContainsXY(r, point.x, point.y)
}

/**
 * Checks if a point is inside a rectangle
 *
 * @remarks
 * The left and top edges are inside, the right and bottom edges are outside.
 *
 * @param r The rectangle
 * @param x The x coordinate of the point
 * @param y The y coordinate of the point
 */
export function rectContainsXY(r: IRect, x: number, y: number): boolean {
  return r.x <= x && x < r.x + r.width && r.y <= y && y < r.y + r.height
}

/**
 * Checks if a rectangle is completely inside another rectangle
 *
 * @param r The outer rectangle
 * @param other The inner rectangle
 */
export function rectContainsRect(r: IRect, other: IRect): boolean {
  return (
    r.x <= other.x &&
    other.x + other.width <= r.x + r.width &&
    r.y <= other.y &&
    other.y + other.height <= r.y + r.height
  )
}

/**
 * Checks if two rectangles overlap
 *
 * @remarks
 * Rectangles that only touch at an edge do not overlap.
 *
 * @param a The first rectangle
 * @param b The second rectangle
 */
export function rectIntersects(a: IRect, b: IRect): boolean {
  return b.x < a.x + a.width && a.x < b.x + b.width && b.y < a.y + a.height && a.y < b.y + b.height
}

/**
 * Calculates the overlapping area of two rectangles
 *
 * @remarks
 * If the rectangles do not overlap, all components of the result are 0.
 *
 * @param a The first rectangle
 * @param b The second rectangle
 * @param out The rectangle to write to.
 */
export function rectIntersection(a: IRect, b: IRect, out?: IRect): IRect {
  out ||= rect()
  const right = Math.min(a.x + a.width, b.x + b.width)
  const bottom = Math.min(a.y + a.height, b.y + b.height)
  const left = Math.max(a.x, b.x)
  const top = Math.max(a.y, b.y)
  if (left < right && top < bottom) {
    return rect$init(out, left, top, right - left, bottom - top)
  }
  return rect$init(out, 0, 0, 0, 0)
}

/**
 * Calculates the smallest rectangle that contains both rectangles
 *
 * @param a The first rectangle
 * @param b The second rectangle
 * @param out The rectangle to write to.
 */
export function rectUnion(a: IRect, b: IRect, out?: IRect): IRect {
  out ||= rect()
  const right = Math.max(a.x + a.width, b.x + b.width)
  const bottom = Math.max(a.y + a.height, b.y + b.height)
  const left = Math.min(a.x, b.x)
  const top = Math.min(a.y, b.y)
  return rect$init(out, left, top, right - left, bottom - top)
}
