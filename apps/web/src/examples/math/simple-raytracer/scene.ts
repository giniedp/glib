import { BoundingBox, BoundingSphere, IVec3, Mat4, Plane, Ray, Vec3 } from '@gglib/math'

const tmpVec1 = Vec3.create() // temporary vector
const localRay = Ray.create() // temporary ray
const EPSILON = 0.001

function randV3(out: IVec3) {
  do { Vec3.initRandomUnit(out) } while (Vec3.lengthSquared(out) > 1)
  return out
}

interface Shape {
  material: Material
  intersectsAt(ray: Ray, out: IVec3): number
  normalAt(surface: IVec3, out: IVec3): void
}

interface Pixel {
  hitPoint: Vec3     // current hit point in world space
  hitNormal: Vec3    // normal at current hit point
  shape: Shape       // shape that has been hit
  material: Material // material of shape
  color: Vec3        // accumulated pixel color
}

class Material {
  public constructor(
    public attenuation: IVec3,
    public metallic: number,
    public roughness: number,
  ) {}
  public scatter(r: Ray, p: Pixel) {
    if (Math.random() <= this.metallic) {
      r.position.initFrom(p.hitPoint)
      r.direction
        .reflect(p.hitNormal)
        .addScaled(randV3(tmpVec1), this.roughness)
        .normalize()
      return r.direction.dot(p.hitNormal) > 0
    } else {
      r.position.initFrom(p.hitPoint)
      randV3(r.direction)
      r.direction.add(p.hitNormal).normalize()
      return true

    }
  }
}

class SphereShape implements Shape {
  private volume = BoundingSphere.create(0, 0, 0, 1)

  constructor(center: IVec3, radius: number, public material: Material) {
    this.volume.initFromCenterRadius(center, radius)
  }

  public intersectsAt(ray: Ray, out: IVec3): number {
    let d = ray.intersectsSphereAt(this.volume)
    if (d > EPSILON) {
      ray.positionAt(d, out)
    } else {
      d = Number.NaN
    }
    return d
  }

  public normalAt(surfacePoint: IVec3, out: IVec3) {
    Vec3.subtract(surfacePoint, this.volume.center, out)
    return Vec3.normalize(out, out)
  }
}

class PlaneShape implements Shape {
  private volume = Plane.create(0, 1, 0, 0)

  constructor(public position: IVec3, public normal: IVec3, public size: number, public material: Material) {
    this.volume.init(normal.x, normal.y, normal.z, 0)
  }

  public intersectsAt(ray: Ray, out: IVec3): number {
    localRay.initFrom(ray).position.subtract(this.position)
    let d = localRay.intersectsPlaneAt(this.volume)
    if (Number.isNaN(d) || d < 0) {
      return Number.NaN
    }
    localRay.positionAt(d, out)
    if (Math.abs(out.x) > this.size || Math.abs(out.y) > this.size || Math.abs(out.z) > this.size) {
      return Number.NaN
    }
    ray.positionAt(d, out)
    return d
  }

  public normalAt(point: IVec3, out: IVec3) {
    Vec3.clone(this.volume, out)
  }
}

class BoxShape implements Shape {
  private volume = BoundingBox.create(-1, -1, -1, 1, 1, 1)
  private transform: Mat4
  private inverse: Mat4
  constructor(position: IVec3, forward: IVec3, scale: IVec3, public material: Material) {
    this.transform = Mat4.createWorld(position, forward, Vec3.Up).scaleV(scale)
    this.inverse = Mat4.invert(this.transform)
  }

  public intersectsAt(ray: Ray, out: IVec3): number {
    this.inverse.transformV3(ray.position, localRay.position)
    this.inverse.transformV3Normal(ray.direction, localRay.direction)
    let d = localRay.intersectsBoxAt(this.volume)
    if (d > EPSILON) {
      localRay.positionAt(d, out)
      this.transform.transformV3(out)
      d = Vec3.distance(out, ray.position)
    }
    return d
  }

  public normalAt(point: IVec3, out: IVec3) {
    this.inverse.transformV3(point, out)
    out.x = Math.abs(out.x) > 1 - EPSILON ? out.x : 0
    out.y = Math.abs(out.y) > 1 - EPSILON ? out.y : 0
    out.z = Math.abs(out.z) > 1 - EPSILON ? out.z : 0
    this.transform.transformV3Normal(out)
    Vec3.normalize(out, out)
  }
}

class Scene {

  public camera = {
    world: Mat4.createIdentity(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  public objects: Shape[] = []

  private viewProj: Mat4 = Mat4.createIdentity()
  private viewProjInv: Mat4 = Mat4.createIdentity()

  public intersect(ray: Ray, pixel: Pixel) {
    let d = Number.MAX_VALUE
    pixel.shape = null
    for (let i = 0; i < this.objects.length; i++) {
      let d1 = this.objects[i].intersectsAt(ray, tmpVec1)
      if (!isNaN(d1) && d1 < d && d1 > 0) {
        d = d1
        pixel.shape = this.objects[i]
        pixel.hitPoint.initFrom(tmpVec1)
      }
    }
    if (pixel.shape != null) {
      pixel.shape.normalAt(pixel.hitPoint, pixel.hitNormal)
      pixel.material = pixel.shape.material
      return true
    }
    return false
  }

  public initRay(u: number, v: number, out: Ray) {
    const start = Vec3.create(u * 2 - 1, -(v * 2 - 1), 0)
    const end = Vec3.createFrom(start).setZ(1)
    this.viewProjInv.transformP3(start)
    this.viewProjInv.transformP3(end)
    return out.initV(start, end.subtract(start).normalize())
  }

  public update() {
    Mat4.premultiply(this.camera.view, this.camera.projection, this.viewProj)
    Mat4.invert(this.viewProj, this.viewProjInv)
  }

  public render(options: { x1: number, y1: number, x2: number, y2: number, dx: number, dy: number, depth: number }, data: Float32Array) {
    this.update()

    const ray = Ray.create(0, 0, 0, 0, 0, 1)
    const pixel: Pixel = {
      color: Vec3.createZero(),
      hitPoint: Vec3.createZero(),
      hitNormal: Vec3.createZero(),
      shape: null,
      material: null,
    }
    let i = 0
    for (let y = options.y1; y < options.y2; y++) {
      for (let x = options.x1; x < options.x2; x++) {
        Vec3.initZero(pixel.color)
        this.initRay((x + Math.random()) * options.dx, (y + Math.random()) * options.dy, ray)
        this.trace(ray, options.depth, pixel)
        pixel.color.toArray(data, i)
        i += 3
      }
    }
  }

  private trace(ray: Ray, depth: number, pixel: Pixel) {
    if (this.intersect(ray, pixel)) {
      // pixel.color.add(pixel.hitNormal)
      if (depth >= 0 && pixel.material.scatter(ray, pixel)) {
        const mat = pixel.material
        ray.position.addScaled(ray.direction, EPSILON)
        this.trace(ray, depth - 1, pixel)
        pixel.color.multiply(mat.attenuation)
      } else {
        Vec3.initZero(pixel.color)
      }
    } else {
      const t = (ray.direction.y + 1) * 0.5
      pixel.color.x = (1 - t) * 1 + t * 0.5
      pixel.color.y = (1 - t) * 1 + t * 0.7
      pixel.color.z = (1 - t) * 1 + t * 1.0
    }
  }
}

const scene = new Scene()
scene.objects.push(
  new PlaneShape(Vec3.create(0, 0, 0), Vec3.Up, 80, new Material(Vec3.create(0.9, 0.9, 0.9), 0, 0)),

  new SphereShape(Vec3.create(-45, 24, -10), 20, new Material(Vec3.create(1, 1, 1), 1, 0)),
  new SphereShape(Vec3.create(0, 24, -10), 20, new Material(Vec3.create(1, 1, 1), 0.5, 0.5)),
  new SphereShape(Vec3.create(45, 24, -10), 20, new Material(Vec3.create(1, 1, 1), 1, 0.3)),

  new SphereShape(Vec3.create(-45, 14, 15), 10, new Material(Vec3.create(1, 0, 0), 0, 0)),
  new SphereShape(Vec3.create(0, 14, 15), 10, new Material(Vec3.create(0, 1, 0), 0, 0)),
  new SphereShape(Vec3.create(45, 14, 15), 10, new Material(Vec3.create(0, 0, 1), 0, 0)),

  new BoxShape(Vec3.create(-45, 3, -5), Vec3.Forward, Vec3.create(15, 1, 30), new Material(Vec3.create(1, 1, 1), 0, 0)),
  new BoxShape(Vec3.create(0, 3, -5), Vec3.Forward, Vec3.create(15, 1, 30), new Material(Vec3.create(1, 1, 1), 0, 0)),
  new BoxShape(Vec3.create(45, 3, -5), Vec3.Forward, Vec3.create(15, 1, 30), new Material(Vec3.create(1, 1, 1), 0, 0)),
)

for (let i = 0; i <= 10; i++) {
  scene.objects.push(new SphereShape(Vec3.create(-1 * (i - 5) * 11, 2, 28), 2, new Material(Vec3.create(1, 1, 1), 1, i / 10)))
}
for (let i = 0; i <= 10; i++) {
  scene.objects.push(new SphereShape(Vec3.create(-1 * (i - 5) * 11, 2, 32), 2, new Material(Vec3.create(1, 1, 1), 1 - i / 10, 0)))
}
scene.camera.view = Mat4.createLookAt({ x: 0, y: 50, z: 75 }, { x: 0, y: 20, z: 0 }, Vec3.Up).invert()
scene.camera.projection = Mat4.createPerspectiveFieldOfView(Math.PI / 3, 300 / 150, 0.1, 10)
