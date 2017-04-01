module Glib {
  export class Ray {
    public position: IVec3
    public direction: IVec3

    constructor(position?: IVec3, direction?: IVec3) {
      this.position = new Glib.Vec3()
      if (position) {
        Vec3.copy(position, this.position)
      }
      this.direction = new Glib.Vec3()
      if (direction) {
        Vec3.copy(direction, this.direction)
      }
    }

    public clone(): Ray {
      return new Ray(this.position, this.direction)
    }
    public copy(other: Ray): Ray {
      Vec3.copy(this.position, other.position)
      Vec3.copy(this.direction, other.direction)
      return other
    }

    public positionAt<T extends IVec3>(distance: number, result: T): T {
      result = result || new Vec3() as any
      result.x = this.direction.x * distance + this.position.x
      result.y = this.direction.y * distance + this.position.y
      result.z = this.direction.z * distance + this.position.z
      return result
    }

    public intersectsSphere(sphere: BoundingSphere): boolean {
      return Collision.intersectsRaySphere(this, sphere)
    }
    public intersectsBox(box: BoundingBox): boolean {
      return Collision.intersectsRayBox(this, box)
    }
    public intersectsPlane(plane: IVec4): boolean {
      return Collision.intersectsRayPlane(this, plane)
    }
    public intersectsTriangle(a: IVec3, b: IVec3, c: IVec3): boolean {
      return Collision.intersectsRayTriangle(this, a, b, c)
    }

    public intersectsSphereAt(sphere: BoundingSphere): number {
      return Collision.intersectionRaySphere(this, sphere)
    }
    public intersectsBoxAt(box: BoundingBox): number {
      return Collision.intersectionRayBox(this, box)
    }
    public intersectsPlaneAt(plane: IVec4): number {
      return Collision.intersectionRayPlane(this, plane)
    }
    public intersectsTriangleAt(a: IVec3, b: IVec3, c: IVec3): number {
      return Collision.intersectionRayTriangle(this, a, b, c)
    }
  }
}
