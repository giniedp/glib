import {
  BoundingBox,
  BoundingSphere,
  IRay,
  IVec3,
  mat4,
  Mat4,
  mat4$initWorld,
  mat4$invert,
  mat4$scale,
  mat4CreateLookAt,
  mat4CreatePerspectiveFieldOfView,
  mat4Identity,
  mat4Invert,
  mat4Premultiply,
  ray$init,
  ray$initFrom,
  rayCreate,
  rayIntersectsBoxAt,
  rayIntersectsPlaneAt,
  rayIntersectsSphereAt,
  rayPositionAt,
  vec3,
  vec3$addScaled,
  vec3$applyMat4,
  vec3$applyMat4Rotation,
  vec3$initFill,
  vec3$initFrom,
  vec3$multiply,
  vec3$normalize,
  vec3$projectMat4,
  vec3$reflect,
  vec3$subtract,
  vec3ApplyMat4,
  vec3Copy,
  vec3Distance,
  vec3Dot,
  vec3Normalize,
  vec3Subtract,
  vec3ToArray,
  vec4,
  vec4$init,
} from '@gglib/math'

const tmpVec1 = vec3() // temporary vector
const localRay = rayCreate() // temporary ray
const EPSILON = 0.001

interface Shape {
  material: Material
  intersectsAt(ray: IRay, out: IVec3): number
  normalAt(surface: IVec3, out: IVec3): void
}

interface Pixel {
  hitPoint: IVec3 // current hit point in world space
  hitNormal: IVec3 // normal at current hit point
  shape: Shape // shape that has been hit
  material: Material // material of shape
  color: IVec3 // accumulated pixel color
}

class Material {
  public constructor(
    public attenuation: IVec3,
    public metallic: number,
    public roughness: number,
    /** light emitted by the surface, emissive surfaces do not scatter */
    public emission: IVec3 | null = null,
  ) {}
  public scatter(r: IRay, p: Pixel) {
    if (Math.random() <= this.metallic) {
      vec3$initFrom(r.position, p.hitPoint)
      vec3$reflect(r.direction, p.hitNormal)
      r.direction.x += (Math.random() * 2 - 1) * this.roughness
      r.direction.y += (Math.random() * 2 - 1) * this.roughness
      r.direction.z += (Math.random() * 2 - 1) * this.roughness
      vec3$normalize(r.direction)
      return vec3Dot(r.direction, p.hitNormal) > 0
    } else {
      vec3$initFrom(r.position, p.hitPoint)
      r.direction.x = Math.random() * 2 - 1 + p.hitNormal.x
      r.direction.y = Math.random() * 2 - 1 + p.hitNormal.y
      r.direction.z = Math.random() * 2 - 1 + p.hitNormal.z
      vec3$normalize(r.direction)
      return true
    }
  }
}

function diffuse(r: number, g: number, b: number) {
  return new Material(vec3(r, g, b), 0, 0)
}

function metal(r: number, g: number, b: number, roughness: number) {
  return new Material(vec3(r, g, b), 1, roughness)
}

function light(r: number, g: number, b: number) {
  return new Material(vec3(0, 0, 0), 0, 0, vec3(r, g, b))
}

/** Seeded random generator, every worker must build the exact same scene */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class SphereShape implements Shape {
  private volume = BoundingSphere.create(0, 0, 0, 1)

  constructor(
    center: IVec3,
    radius: number,
    public material: Material,
  ) {
    this.volume.initFromCenterRadius(center, radius)
  }

  public intersectsAt(ray: IRay, out: IVec3): number {
    let d = rayIntersectsSphereAt(ray, this.volume)
    if (d > EPSILON) {
      rayPositionAt(ray, d, out)
    } else {
      d = Number.NaN
    }
    return d
  }

  public normalAt(surfacePoint: IVec3, out: IVec3) {
    vec3Subtract(surfacePoint, this.volume.center, out)
    return vec3$normalize(out)
  }
}

class PlaneShape implements Shape {
  private volume = vec4(0, 1, 0, 0)

  constructor(
    public position: IVec3,
    public normal: IVec3,
    public size: number,
    public material: Material,
  ) {
    vec4$init(this.volume, normal.x, normal.y, normal.z, 0)
  }

  public intersectsAt(ray: IRay, out: IVec3): number {
    ray$initFrom(localRay, ray)
    vec3$subtract(localRay.position, this.position)

    let d = rayIntersectsPlaneAt(localRay, this.volume)
    if (Number.isNaN(d) || d < 0) {
      return Number.NaN
    }
    rayPositionAt(localRay, d, out)
    if (Math.abs(out.x) > this.size || Math.abs(out.y) > this.size || Math.abs(out.z) > this.size) {
      return Number.NaN
    }
    rayPositionAt(ray, d, out)
    return d
  }

  public normalAt(point: IVec3, out: IVec3) {
    vec3Copy(this.volume, out)
  }
}

class BoxShape implements Shape {
  private volume = BoundingBox.create(-1, -1, -1, 1, 1, 1)
  private transform: Mat4
  private inverse: Mat4
  constructor(
    position: IVec3,
    forward: IVec3,
    scale: IVec3,
    public material: Material,
  ) {
    this.transform = mat4()
    mat4$initWorld(this.transform, position, forward, vec3.UnitY)
    mat4$scale(this.transform, scale)
    this.inverse = mat4Invert(this.transform)
  }

  public intersectsAt(ray: IRay, out: IVec3): number {
    ray$initFrom(localRay, ray)
    vec3$applyMat4(localRay.position, this.inverse)
    vec3$applyMat4Rotation(localRay.direction, this.inverse)
    let d = rayIntersectsBoxAt(localRay, this.volume)
    if (d > EPSILON) {
      rayPositionAt(localRay, d, out)
      vec3$applyMat4(out, this.transform)
      d = vec3Distance(out, ray.position)
    } else {
      d = Number.NaN
    }
    return d
  }

  public normalAt(point: IVec3, out: IVec3) {
    vec3ApplyMat4(point, this.inverse, out)
    out.x = Math.abs(out.x) > 1 - EPSILON ? out.x : 0
    out.y = Math.abs(out.y) > 1 - EPSILON ? out.y : 0
    out.z = Math.abs(out.z) > 1 - EPSILON ? out.z : 0
    vec3$applyMat4Rotation(out, this.transform)
    vec3$normalize(out)
  }
}

export class Scene {
  public camera = {
    world: mat4Identity(),
    view: mat4Identity(),
    projection: mat4Identity(),
  }

  public objects: Shape[] = []
  /** sky gradient, also the only light source unless the scene has emissive materials */
  public skyBottom = vec3(1, 1, 1)
  public skyTop = vec3(0.5, 0.7, 1.0)

  public lookAt(eye: IVec3, target: IVec3, fov: number) {
    this.camera.view = mat4CreateLookAt(eye, target, vec3.UnitY)
    mat4$invert(this.camera.view)
    this.camera.projection = mat4CreatePerspectiveFieldOfView(fov, 16 / 9, 0.1, 10, -1)
    return this
  }

  public add(...shapes: Shape[]) {
    this.objects.push(...shapes)
    return this
  }

  private viewProj: Mat4 = mat4Identity()
  private viewProjInv: Mat4 = mat4Identity()

  public intersect(ray: IRay, pixel: Pixel) {
    let d = Number.MAX_VALUE
    pixel.shape = null!
    for (let i = 0; i < this.objects.length; i++) {
      let d1 = this.objects[i].intersectsAt(ray, /* out */ vec3.$0)
      if (!isNaN(d1) && d1 < d && d1 > 0) {
        d = d1
        pixel.shape = this.objects[i]
        vec3Copy(vec3.$0, pixel.hitPoint)
      }
    }
    if (pixel.shape != null) {
      pixel.shape.normalAt(pixel.hitPoint, pixel.hitNormal)
      pixel.material = pixel.shape.material
      return true
    }
    return false
  }

  public initRay(u: number, v: number, out: IRay) {
    const start = vec3(u * 2 - 1, -(v * 2 - 1), 0)
    const end = vec3(start.x, start.y, 1)
    vec3$projectMat4(start, this.viewProjInv)
    vec3$projectMat4(end, this.viewProjInv)
    ray$init(out, start, vec3Normalize(vec3Subtract(end, start)))
    return out
  }

  public update() {
    mat4Premultiply(this.camera.view, this.camera.projection, this.viewProj)
    mat4Invert(this.viewProj, this.viewProjInv)
  }

  public render(
    options: { x1: number; y1: number; x2: number; y2: number; dx: number; dy: number; depth: number },
    data: Float32Array,
  ) {
    this.update()

    const ray = rayCreate(vec3(), vec3(0, 0, 1))
    const pixel: Pixel = {
      color: vec3(),
      hitPoint: vec3(),
      hitNormal: vec3(),
      shape: null!,
      material: null!,
    }
    let i = 0
    for (let y = options.y1; y < options.y2; y++) {
      for (let x = options.x1; x < options.x2; x++) {
        vec3$initFill(pixel.color, 0)
        this.initRay((x + Math.random()) * options.dx, (y + Math.random()) * options.dy, ray)
        this.trace(ray, options.depth, pixel)
        vec3ToArray(pixel.color, data, i)
        i += 3
      }
    }
  }

  private trace(ray: IRay, depth: number, pixel: Pixel) {
    if (this.intersect(ray, pixel)) {
      // pixel.color.add(pixel.hitNormal)
      if (pixel.material.emission) {
        vec3$initFrom(pixel.color, pixel.material.emission)
      } else if (depth >= 0 && pixel.material.scatter(ray, pixel)) {
        const mat = pixel.material
        vec3$addScaled(ray.position, ray.direction, EPSILON)
        this.trace(ray, depth - 1, pixel)
        vec3$multiply(pixel.color, mat.attenuation)
      } else {
        vec3$initFill(pixel.color, 0)
      }
    } else {
      const t = (ray.direction.y + 1) * 0.5
      pixel.color.x = (1 - t) * this.skyBottom.x + t * this.skyTop.x
      pixel.color.y = (1 - t) * this.skyBottom.y + t * this.skyTop.y
      pixel.color.z = (1 - t) * this.skyBottom.z + t * this.skyTop.z
    }
  }
}

function showcase() {
  const scene = new Scene()
  scene.add(
    new PlaneShape(vec3(0, 0, 0), vec3.UnitY, 80, diffuse(0.9, 0.9, 0.9)),

    new SphereShape(vec3(-45, 24, -10), 20, metal(1, 1, 1, 0)),
    new SphereShape(vec3(0, 24, -10), 20, new Material(vec3(1, 1, 1), 0.5, 0.5)),
    new SphereShape(vec3(45, 24, -10), 20, metal(1, 1, 1, 0.3)),

    new SphereShape(vec3(-45, 14, 15), 10, diffuse(1, 0, 0)),
    new SphereShape(vec3(0, 14, 15), 10, diffuse(0, 1, 0)),
    new SphereShape(vec3(45, 14, 15), 10, diffuse(0, 0, 1)),

    new BoxShape(vec3(-45, 3, -5), vec3(0, 0, -1), vec3(15, 1, 30), diffuse(1, 1, 1)),
    new BoxShape(vec3(0, 3, -5), vec3(0, 0, -1), vec3(15, 1, 30), diffuse(1, 1, 1)),
    new BoxShape(vec3(45, 3, -5), vec3(0, 0, -1), vec3(15, 1, 30), diffuse(1, 1, 1)),
  )
  // roughness and metallic gradients
  for (let i = 0; i <= 10; i++) {
    scene.add(new SphereShape(vec3(-1 * (i - 5) * 11, 2, 28), 2, metal(1, 1, 1, i / 10)))
  }
  for (let i = 0; i <= 10; i++) {
    scene.add(new SphereShape(vec3(-1 * (i - 5) * 11, 2, 32), 2, new Material(vec3(1, 1, 1), 1 - i / 10, 0)))
  }
  return scene.lookAt(vec3(0, 50, 75), vec3(0, 20, 0), Math.PI / 3)
}

/** Inspired by the cover of "Ray Tracing in One Weekend" */
function randomSpheres() {
  const random = mulberry32(42)
  const scene = new Scene()
  const big = [vec3(-45, 20, 0), vec3(0, 20, 0), vec3(45, 20, 0)]
  scene.add(
    new PlaneShape(vec3(0, 0, 0), vec3.UnitY, 300, diffuse(0.5, 0.5, 0.5)),
    new SphereShape(big[0], 20, diffuse(0.4, 0.2, 0.1)),
    new SphereShape(big[1], 20, metal(0.95, 0.95, 0.95, 0)),
    new SphereShape(big[2], 20, metal(0.7, 0.6, 0.5, 0.15)),
  )
  for (let a = -6; a <= 6; a++) {
    for (let b = -4; b <= 4; b++) {
      const center = vec3(a * 15 + random() * 9, 3, b * 15 + random() * 9)
      if (big.some((it) => vec3Distance(it, vec3(center.x, 20, center.z)) < 26)) {
        continue
      }
      const choice = random()
      let material: Material
      if (choice < 0.75) {
        material = diffuse(random() * random(), random() * random(), random() * random())
      } else {
        material = metal(0.5 + random() * 0.5, 0.5 + random() * 0.5, 0.5 + random() * 0.5, random() * 0.4)
      }
      scene.add(new SphereShape(center, 3, material))
    }
  }
  return scene.lookAt(vec3(110, 35, 90), vec3(0, 10, 0), Math.PI / 4)
}

/** Closed room lit by a ceiling light only */
function cornellBox() {
  const scene = new Scene()
  vec3$initFill(scene.skyBottom, 0)
  vec3$initFill(scene.skyTop, 0)
  const white = diffuse(0.75, 0.75, 0.75)
  scene.add(
    new PlaneShape(vec3(0, 0, 0), vec3(0, 1, 0), 100, white), // floor
    new PlaneShape(vec3(0, 100, 0), vec3(0, -1, 0), 100, white), // ceiling
    new PlaneShape(vec3(0, 50, -100), vec3(0, 0, 1), 100, white), // back
    new PlaneShape(vec3(-100, 50, 0), vec3(1, 0, 0), 100, diffuse(0.75, 0.1, 0.1)), // left
    new PlaneShape(vec3(100, 50, 0), vec3(-1, 0, 0), 100, diffuse(0.1, 0.65, 0.15)), // right
    new BoxShape(vec3(0, 99.5, -40), vec3(0, 0, -1), vec3(60, 0.5, 40), light(5, 4.6, 3.8)),

    new BoxShape(vec3(-45, 35, -55), vec3Normalize(vec3(1, 0, -2)), vec3(20, 35, 20), white),
    new SphereShape(vec3(40, 25, -30), 25, metal(0.95, 0.95, 0.95, 0.02)),
    new BoxShape(vec3(-5, 12, -10), vec3Normalize(vec3(-1, 0, -1)), vec3(12, 12, 12), diffuse(0.2, 0.3, 0.75)),
  )
  return scene.lookAt(vec3(0, 50, 95), vec3(0, 45, -100), Math.PI / 3)
}

/** Glowing spheres reflecting in chrome at night */
function nightLights() {
  const scene = new Scene()
  vec3$initFill(scene.skyBottom, 0.02)
  scene.skyTop = vec3(0, 0, 0.01)
  scene.add(
    new PlaneShape(vec3(0, 0, 0), vec3.UnitY, 200, new Material(vec3(0.6, 0.6, 0.65), 0.4, 0.15)),
    new SphereShape(vec3(0, 22, -10), 22, metal(0.95, 0.95, 0.95, 0)),
    new BoxShape(vec3(-50, 15, -20), vec3Normalize(vec3(1, 0, -1)), vec3(12, 15, 12), metal(0.9, 0.8, 0.6, 0.1)),
    new BoxShape(vec3(50, 10, -25), vec3Normalize(vec3(-1, 0, -2)), vec3(10, 10, 10), diffuse(0.8, 0.8, 0.8)),

    new SphereShape(vec3(-32, 9, 25), 9, light(4, 0.8, 0.25)),
    new SphereShape(vec3(0, 8, 38), 8, light(0.5, 3, 1)),
    new SphereShape(vec3(32, 9, 25), 9, light(0.5, 1, 4.5)),
    new SphereShape(vec3(-20, 60, -70), 18, light(2.5, 2.2, 1.6)),
  )
  return scene.lookAt(vec3(0, 35, 100), vec3(0, 15, 0), Math.PI / 3)
}

/**
 * Available scenes by name. Scenes are built on demand, each worker builds its own copy.
 */
export const scenes: Record<string, () => Scene> = {
  Showcase: showcase,
  'Random Spheres': randomSpheres,
  'Cornell Box': cornellBox,
  'Night Lights': nightLights,
}

export const sceneNames = Object.keys(scenes)
