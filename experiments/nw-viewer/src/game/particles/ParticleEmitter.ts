import {
  DEGREE_TO_RAD,
  quat$multiply,
  vec3,
  vec3$addScaled,
  vec3$applyQuat,
  vec3$init,
  vec3$initFill,
  vec3$initFrom,
  vec3$multiplyScalar,
  vec3$normalize,
  vec3$subtract,
  vec3ApplyQuat,
  vec3Cross,
  vec3DistanceSquared,
  vec3Dot,
  vec3Length,
  vec3Normalize,
  vec3Subtract,
  vec4,
  vec4$init,
  vec4$initFrom,
  type IVec3,
  type IVec4,
} from '@gglib/math'
import type { ParticleParams, VarParam } from '../../formats/particles'
import { ageValue, colorMod, colorValue, hasAgeCurve, varMod, varValue } from './eval'
import { AXIS_X, AXIS_Y, AXIS_Z, quat$initFromTo, quat$initRotationXYZ, quat$integrate, quat$rotateToUp, random } from './math'

/**
 * World gravity, the physics environment of the engine
 */
const GRAVITY = -9.81

/**
 * Number of floats per particle in the instance buffer, see ParticleMaterial.wgsl VertexInput
 */
export const PARTICLE_INSTANCE_FLOATS = 20

/**
 * Hard limit of particles per emitter
 */
export const PARTICLE_EMITTER_CAPACITY_MAX = 2000

/**
 * Location of the emitter: world position, rotation and uniform scale
 */
export interface ParticleLocation {
  position: IVec3
  rotation: IVec4
  scale: number
}

/**
 * Per instance settings of the emitting component (engine SpawnParams)
 */
export interface ParticleSpawnParams {
  countScale: number
  sizeScale: number
  speedScale: number
  timeScale: number
  /**
   * Fixed emitter strength 0..1, negative uses the emitter age
   */
  strength: number
  color: [number, number, number]
  alphaScale: number
}

/**
 * Camera inputs for orienting and sorting particles
 */
export interface ParticleCamera {
  position: IVec3
}

class Particle {
  public age = 0
  public stopAge = 1
  public pos = vec3()
  public vel = vec3()
  /**
   * Velocity of the shape emitters (point, box …) added on top of the physics
   */
  public userVel = vec3()
  /**
   * Center of the circle and sphere emitters in world space (m_originalEmitterLocation), their velocity moves the
   * particle around it
   */
  public center = vec3()
  public rot = vec4(0, 0, 0, 1)
  public rotVel = vec3()
  public angle = 0
  public angleVel = 0
  public sizeScale = 1

  // base modifiers (random and emitter strength at emission)
  public sizeX = 1
  public sizeY = 1
  public pivotX = 1
  public pivotY = 1
  public stretch = 1
  public air = 1
  public gravity = 1
  public turbulence = 1
  public rotateX = 1
  public rotateY = 1
  public rotateZ = 1
  public alpha = 1
  public color = [1, 1, 1]
  public lerp = 0
  public tile = 0
  public flipX = 1
  public flipY = 1
  public cameraDistance = 0
}

const tmpA = vec3()
const tmpB = vec3()
const tmpC = vec3()
const tmpD = vec3()
const tmpE = vec3()
const tmpQ = vec4()
const tmpQ2 = vec4()
const tmpColor = [1, 1, 1]

/**
 * Simulates one (sub) effect of a particle effect on the CPU. A port of the CryEngine `CParticleSubEmitter`
 * and `CParticle` behavior for sprite particles.
 *
 * @remarks
 * Supports continuous and burst emission, pulse period, spawn delay, emitter lifetime, the shapes angle, point, box,
 * sphere and circle (simplified), focus angles, emit angle, speed, gravity, air resistance, acceleration,
 * 3D turbulence, 2D and 3D rotation, orient to velocity, and the curves over the particle life.
 */
export class ParticleEmitter {
  public readonly params: ParticleParams
  public readonly capacity: number
  public readonly is3DRotation: boolean

  private particles: Particle[] = []
  private pool: Particle[] = []
  private spawn: ParticleSpawnParams
  private location: ParticleLocation

  private age = 0
  private activateAge = 0
  private startAge = 0
  private stopAge = 0
  private repeatAge = Infinity
  private lastEmitAge = 0
  private emitIndex = 0
  private focusAngle = 0
  private focusAzimuth = 0
  private posIncrement = vec3()
  private texAspectX = 1
  private texAspectY = 1

  public constructor(params: ParticleParams, spawn: ParticleSpawnParams, location: ParticleLocation) {
    this.params = params
    this.spawn = spawn
    this.location = location
    this.is3DRotation = params.facing === 'Free' || params.facing === 'Decal'
    const count = Math.max(1, params.count.base * (1 + params.count.random) * spawn.countScale)
    this.capacity = Math.min(PARTICLE_EMITTER_CAPACITY_MAX, Math.ceil(count * 1.25) + 4)
    this.initialize(0)
  }

  public get count() {
    return this.particles.length
  }

  /**
   * Aspect of a single texture tile, scales the sprite axes (CryEngine `m_vTexAspect`)
   */
  public setTextureSize(width: number, height: number) {
    const tiling = this.params.textureTiling
    const aspect = width / tiling.tilesX / (height / tiling.tilesY)
    this.texAspectX = aspect > 1 ? 1 : aspect
    this.texAspectY = aspect > 1 ? 1 / aspect : 1
  }

  /**
   * Simulates the emitter to its steady state, like the engine pre roll
   */
  public preroll(time: number, step = 1 / 15) {
    for (let t = 0; t < time; t += step) {
      this.update(step)
    }
  }

  /**
   * Ages the emitter and its particles and emits new particles
   */
  public update(dt: number) {
    dt *= this.spawn.timeScale
    if (dt <= 0) {
      return
    }
    this.age += dt
    if (this.age >= this.repeatAge) {
      this.initialize(this.repeatAge)
    }
    this.updateParticles(dt)
    this.emit(dt)
  }

  private initialize(age: number) {
    const p = this.params
    this.emitIndex = 0
    this.activateAge = age
    this.repeatAge = Infinity
    if (p.pulsePeriod.base > 0) {
      const repeat = Math.max(varValue(p.pulsePeriod, 0), 0.1)
      this.repeatAge = this.activateAge + repeat
    }
    this.startAge = this.stopAge = this.lastEmitAge = this.activateAge + varValue(p.spawnDelay, 0)
    if (p.continuous || !p.particleLifeTime.base) {
      if (p.emitterLifeTime.base) {
        this.stopAge += varValue(p.emitterLifeTime, 0)
      } else {
        this.stopAge = Infinity
      }
    }
    // the focus is randomized per emitter cycle (m_ChaosKey)
    this.focusAngle = varValue(p.focusAngle, 0)
    this.focusAzimuth = varValue(p.focusAzimuth, 0)
    vec3$initFill(this.posIncrement, 0)
  }

  private relativeAge() {
    if (this.age <= this.startAge || !Number.isFinite(this.stopAge)) {
      return 0
    }
    return Math.min(1, (this.age - this.startAge) / (this.stopAge - this.startAge))
  }

  private strength() {
    const strength = this.spawn.strength
    if (strength >= 0) {
      return Math.min(strength, 1)
    }
    if (this.params.continuous) {
      return this.relativeAge()
    }
    return Math.min(1, this.emitIndex / Math.max(1, this.params.count.base))
  }

  private emit(dt: number) {
    const p = this.params
    const age = this.age
    if (age < this.startAge || (!p.continuous && age < this.lastEmitAge)) {
      return
    }
    const strength = this.strength()
    const count = varValue(p.count, strength) * this.spawn.countScale
    if (count <= 0) {
      return
    }
    const emitterLife = this.stopAge - this.startAge
    let particleLife = p.particleLifeTime.base
    if (particleLife < 1e-6) {
      particleLife = emitterLife
      if (!(particleLife > 0) || !Number.isFinite(particleLife)) {
        return
      }
    }

    if (p.continuous) {
      let rate = count / particleLife
      if (Number.isFinite(emitterLife) && emitterLife > 0) {
        rate = Math.max(rate, count / emitterLife)
      }
      const increment = 1 / rate
      const age0 = Math.max(this.lastEmitAge, this.startAge)
      const age1 = Math.min(age, this.stopAge)
      let emitAge = age0
      // skip the time before particles would still be alive
      const fullLife = particleLife * (1 + p.particleLifeTime.random)
      if (age - fullLife > emitAge) {
        emitAge += Math.ceil((age - fullLife - emitAge) * rate) * increment
      }
      while (emitAge + increment <= age1) {
        emitAge += increment
        // particles emitted within the frame are aged by the remaining time
        if (!this.emitParticle(strength, age - emitAge)) {
          emitAge = age1
          break
        }
      }
      this.lastEmitAge = emitAge
    } else {
      // emit once, always on the first frame
      if (age <= this.startAge + particleLife + dt * 2) {
        for (let n = Math.round(count); n > 0; n--) {
          if (!this.emitParticle(strength, age - this.startAge)) {
            break
          }
        }
      }
      this.lastEmitAge = Infinity
    }
  }

  private emitParticle(emitterStrength: number, past: number): boolean {
    if (this.particles.length >= this.capacity) {
      return false
    }
    const particle = this.pool.pop() || new Particle()
    this.initParticle(particle, emitterStrength)
    this.emitIndex++
    this.particles.push(particle)
    if (past > 0) {
      this.updateParticle(particle, Math.min(past, particle.stopAge))
    }
    return true
  }

  private initParticle(pt: Particle, strength: number) {
    const p = this.params
    const spawn = this.spawn
    const loc = this.location
    const shape = p.emitterShape

    pt.age = 0
    pt.lerp = Math.random()
    pt.stopAge = p.particleLifeTime.base ? varValue(p.particleLifeTime, strength) : Infinity
    if (!(pt.stopAge > 0)) {
      pt.stopAge = 0.001
    }

    // base modifiers
    pt.sizeX = varMod(p.sizeX, strength)
    pt.sizeY = p.maintainAspectRatio ? pt.sizeX : varMod(p.sizeY, strength)
    pt.pivotX = varMod(p.pivotX, strength)
    pt.pivotY = varMod(p.pivotY, strength)
    pt.stretch = varMod(p.stretch, strength)
    pt.air = varMod(p.airResistance, strength)
    pt.gravity = varMod(p.gravityScale, strength)
    pt.turbulence = varMod(p.turbulence3DSpeed, strength)
    pt.rotateX = varMod(p.rotationRateX, strength)
    pt.rotateY = varMod(p.rotationRateY, strength)
    pt.rotateZ = varMod(p.rotationRateZ, strength)
    colorMod(pt.color, p.color, strength, pt.lerp)
    pt.alpha = varMod(p.alpha, strength, pt.lerp)
    pt.sizeScale = loc.scale * spawn.sizeScale

    // texture tile and flips
    const tiling = p.textureTiling
    const variant = tiling.variantCount > 1 ? Math.floor(Math.random() * tiling.variantCount) : 0
    pt.tile = tiling.firstTile + variant * tiling.animFramesCount
    pt.flipX = Math.random() < tiling.horizontalFlipChance ? -1 : 1
    pt.flipY = Math.random() < tiling.verticalFlipChance ? -1 : 1

    // orientation and emission direction
    const rot = vec4$initFrom(pt.rot, loc.rotation)
    const dir = vec3$initFill(pt.vel, 0)
    if (shape === 'ANGLE' || shape === 'TRAIL' || shape === 'BEAM') {
      this.focusDir(dir, p.focusRotatesEmitter ? rot : null)
    }

    // velocity part 1, the point emitter emits in a cone around the velocity direction
    const userVel = vec3$initFill(pt.userVel, 0)
    if (shape === 'POINT') {
      const spread = Math.cos(varValue(p.velocitySpread, strength) * 0.5 * DEGREE_TO_RAD)
      const z = Math.random() * (1 - spread) + spread
      const phi = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.max(0, 1 - z * z))
      vec3$init(dir, r * Math.cos(phi), r * Math.sin(phi), z)
      vec3$init(tmpA, p.velocity[0].base, p.velocity[1].base, p.velocity[2].base)
      if (vec3Length(tmpA) > 0) {
        vec3$applyQuat(dir, quat$initFromTo(tmpQ, AXIS_Z, vec3$normalize(tmpA)))
      }
    }
    if (shape === 'POINT' || shape === 'CIRCLE' || shape === 'SPHERE' || shape === 'BOX') {
      vec3$init(
        userVel,
        varValue(p.velocityXYZRandom[0], strength) * random(-1, 1),
        varValue(p.velocityXYZRandom[1], strength) * random(-1, 1),
        varValue(p.velocityXYZRandom[2], strength) * random(-1, 1),
      )
    }

    // emitter offset (SpawnPosOffset, SpawnPosRandomOffset, OffsetRoundness, SpawnIncrement)
    const offset = this.emitterOffset(tmpB, strength)

    // particle position offset of the shape emitters
    const local = vec3$initFill(tmpC, 0)
    const spX = varValue(p.spawnPosXYZ[0], strength) + varValue(p.spawnPosXYZRandom[0], strength) * random(-1, 1)
    const spY = varValue(p.spawnPosXYZ[1], strength) + varValue(p.spawnPosXYZRandom[1], strength) * random(-1, 1)
    const spZ = varValue(p.spawnPosXYZ[2], strength) + varValue(p.spawnPosXYZRandom[2], strength) * random(-1, 1)
    if (shape === 'SPHERE' || shape === 'CIRCLE') {
      const incX = varRandom(p.spawnPosIncrementXYZ[0], p.spawnPosIncrementXYZRandom[0], strength)
      const incY = varRandom(p.spawnPosIncrementXYZ[1], p.spawnPosIncrementXYZRandom[1], strength)
      const incZ = varRandom(p.spawnPosIncrementXYZ[2], p.spawnPosIncrementXYZRandom[2], strength)
      const radius = varValue(p.emitterSizeDiameter, strength) * 0.5
      const circumference = Math.PI * 2 * radius
      const inc = this.posIncrement
      const scaleX = (0.01 * (incX + inc.x)) % 1
      const offsetX = -(radius + spX + scaleX * radius)
      if (radius > 0) {
        if (shape === 'SPHERE') {
          const yAngle = Math.PI * 0.5 - (spY + circumference * 0.01 * (inc.y + incY)) / radius
          const zAngle = -(spZ + circumference * 0.01 * (inc.z + incZ)) / radius
          vec3$init(
            local,
            -Math.cos(yAngle) * Math.cos(zAngle) * offsetX,
            Math.sin(yAngle) * offsetX,
            -Math.cos(yAngle) * Math.sin(zAngle) * offsetX,
          )
        } else {
          const scaleZ = (0.01 * (incZ + inc.z)) % 1
          const angle = Math.PI * 0.5 + (spY + circumference * 0.01 * (inc.y + incY)) / radius
          vec3$init(local, Math.cos(angle) * offsetX, Math.sin(angle) * offsetX, spZ + scaleZ * radius)
        }
      } else if (shape === 'SPHERE') {
        local.y = offsetX
      }
      inc.x += incX
      inc.y += incY
      inc.z += incZ
    } else if (shape === 'POINT') {
      vec3$addScaled(vec3$init(local, spX, spY, spZ), dir, varValue(p.spawnOffset, strength))
    } else if (shape === 'BOX') {
      vec3$init(
        local,
        varValue(p.emitterSizeXYZ[0], strength) * 0.5 + spX,
        -varValue(p.emitterSizeXYZ[1], strength) * 0.5 + spY,
        -varValue(p.emitterSizeXYZ[2], strength) * 0.5 + spZ,
      )
    }

    if (p.emitOffsetDir) {
      vec3$applyQuat(vec3$normalize(vec3$addScaled(vec3$initFrom(dir, offset), local, 1)), loc.rotation)
    }

    // velocity part 2, the angle emitter spreads within the emit angle around the focus direction
    if (shape === 'ANGLE') {
      const phiMax = p.emitAngle.base
      let phi = varValue(p.emitAngle, strength)
      if (phi > 0 && vec3Length(dir) > 1e-6) {
        phi /= phiMax
        phi = Math.acos(1 + phi * (Math.cos(phiMax * DEGREE_TO_RAD) - 1))
        const theta = Math.random() * Math.PI * 2
        const x =
          Math.abs(dir.z) > 1e-6
            ? vec3$normalize(vec3$init(tmpD, 0, -dir.z, dir.y))
            : vec3$normalize(vec3$init(tmpD, -dir.y, dir.x, 0))
        const y = vec3Cross(dir, x, tmpE)
        const sp = Math.sin(phi)
        vec3$multiplyScalar(dir, Math.cos(phi))
        vec3$addScaled(dir, x, Math.cos(theta) * sp)
        vec3$addScaled(dir, y, Math.sin(theta) * sp)
      }
    }

    // to world
    const pos = vec3$initFrom(pt.pos, loc.position)
    const s = loc.scale
    if (shape === 'CIRCLE' || shape === 'SPHERE') {
      vec3$addScaled(vec3$initFrom(pt.center, loc.position), vec3ApplyQuat(offset, loc.rotation, tmpA), s)
    }
    if (p.moveRelEmitter) {
      vec3$addScaled(vec3$initFrom(tmpA, offset), local, 1)
      vec3$addScaled(pos, vec3$applyQuat(tmpA, loc.rotation), s)
      if (shape === 'POINT') {
        vec3$applyQuat(dir, loc.rotation)
      }
    } else {
      vec3$addScaled(pos, vec3ApplyQuat(offset, loc.rotation, tmpA), s)
      vec3$addScaled(pos, local, s)
    }

    // speed
    vec3$multiplyScalar(dir, varValue(p.speed, strength) * spawn.speedScale * s)

    // initial rotation
    if (this.is3DRotation) {
      const r = p.randomAngles
      quat$initRotationXYZ(
        tmpQ,
        (p.initAngles[0] + random(-r[0], r[0])) * DEGREE_TO_RAD,
        (p.initAngles[1] + random(-r[1], r[1])) * DEGREE_TO_RAD,
        (p.initAngles[2] + random(-r[2], r[2])) * DEGREE_TO_RAD,
      )
      quat$multiply(rot, tmpQ)
      this.rotationRate(pt.rotVel, pt, 0)
      vec3$applyQuat(pt.rotVel, rot)
      pt.angle = 0
      pt.angleVel = 0
    } else {
      pt.angle = (p.initAngles[1] + random(-1, 1) * p.randomAngles[1]) * DEGREE_TO_RAD
      pt.angleVel = ageValue(p.rotationRateY, pt.rotateY, 0) * DEGREE_TO_RAD
    }
    this.align(pt)
  }

  /**
   * Rotation rates over the particle life in radians per second (particle space)
   */
  private rotationRate(out: IVec3, pt: Particle, age: number) {
    const p = this.params
    return vec3$init(
      out,
      ageValue(p.rotationRateX, pt.rotateX, age) * DEGREE_TO_RAD,
      ageValue(p.rotationRateY, pt.rotateY, age) * DEGREE_TO_RAD,
      ageValue(p.rotationRateZ, pt.rotateZ, age) * DEGREE_TO_RAD,
    )
  }

  /**
   * Emission focus direction (emitter Z axis), rotated by gravity direction and focus angles. See `GetEmitFocusDir`.
   */
  private focusDir(out: IVec3, rot: IVec4 | null) {
    const p = this.params
    const q = vec4$initFrom(tmpQ, this.location.rotation)
    vec3ApplyQuat(AXIS_Z, q, out)
    if (p.focusGravityDir) {
      vec3$initFrom(out, AXIS_Z)
      if (p.focusAngle.base || rot) {
        quat$rotateToUp(q, out)
      }
    }
    if (p.focusAngle.base) {
      quat$multiply(q, quat$initRotationXYZ(tmpQ2, this.focusAngle * DEGREE_TO_RAD, 0, this.focusAzimuth * DEGREE_TO_RAD))
      vec3ApplyQuat(AXIS_Z, q, out)
    }
    if (rot) {
      vec4$initFrom(rot, q)
    }
    return out
  }

  /**
   * Random offset within the spawn volume, see `ParticleParams::GetEmitterOffset`
   */
  private emitterOffset(out: IVec3, strength: number): IVec3 {
    const p = this.params
    const [rx, ry, rz] = p.spawnPosRandomOffset
    // emit box and rounding scale, see CParticleContainer::UpdateParticles
    const roundness = p.offsetRoundness
    let bx = rx
    let by = ry
    let bz = rz
    let sx = 0
    let sy = 0
    let sz = 0
    if (roundness) {
      const round = roundness * Math.max(bx, by, bz)
      const ux = Math.min(bx, round)
      const uy = Math.min(by, round)
      const uz = Math.min(bz, round)
      bx -= ux
      by -= uy
      bz -= uz
      sx = ux ? 1 / ux : 0
      sy = uy ? 1 / uy : 0
      sz = uz ? 1 / uz : 0
    }
    const inner = p.spawnIncrement.base ? Math.min(1, varValue(p.spawnIncrement, strength)) : 0
    for (let i = 0; i < 16; i++) {
      vec3$init(out, random(-1, 1) * rx, random(-1, 1) * ry, random(-1, 1) * rz)
      if (roundness) {
        const ex = Math.max(Math.abs(out.x) - bx, 0) * sx
        const ey = Math.max(Math.abs(out.y) - by, 0) * sy
        const ez = Math.max(Math.abs(out.z) - bz, 0) * sz
        if (ex * ex + ey * ey + ez * ez > 1) {
          continue
        }
      }
      break
    }
    if (inner > 0) {
      // move towards the outer surface by the inner fraction
      const scale = Math.min(
        rx && out.x ? rx / Math.abs(out.x) : Infinity,
        ry && out.y ? ry / Math.abs(out.y) : Infinity,
        rz && out.z ? rz / Math.abs(out.z) : Infinity,
      )
      if (Number.isFinite(scale)) {
        vec3$multiplyScalar(out, 1 + (scale - 1) * inner)
      }
    }
    out.x += p.spawnPosOffset[0]
    out.y += p.spawnPosOffset[1]
    out.z += p.spawnPosOffset[2]
    return out
  }

  private updateParticles(dt: number) {
    const list = this.particles
    let write = 0
    for (let i = 0; i < list.length; i++) {
      const pt = list[i]
      const step = Math.min(dt, Math.max(pt.stopAge - pt.age, 0))
      this.updateParticle(pt, step)
      pt.age += dt - step
      if (pt.age >= pt.stopAge) {
        this.pool.push(pt)
        continue
      }
      list[write++] = pt
    }
    list.length = write
  }

  /**
   * Moves a particle, see `CParticle::Move` and `CParticle::UpdateAlignment`
   */
  /**
   * Velocity of the circle and sphere emitters, see `CParticle::Move`. The velocity is polar around the particle center
   * in emitter space: x moves away from the center, y along the (horizontal) circumference, z up (circle) or along the
   * vertical circumference (sphere).
   *
   * @param step - velocity times the time step
   */
  private moveAroundCenter(pt: Particle, step: IVec3) {
    const loc = this.location
    // emitter space rotation, the original works in world space for particles that do not move with the emitter
    const q = this.params.moveRelEmitter ? loc.rotation : null
    if (q) {
      vec3$multiplyScalar(step, loc.scale)
    }
    const origin = vec3Subtract(pt.pos, pt.center, tmpD)
    if (q) {
      vec3$applyQuat(origin, vec4$init(tmpQ2, -q.x, -q.y, -q.z, q.w))
    }

    if (this.params.emitterShape === 'SPHERE') {
      const radius = vec3Length(origin) + step.x
      if (radius > 0) {
        // rotation about z by the horizontal, then about y by the vertical circumference step
        quat$initRotationXYZ(tmpQ, 0, step.z / radius, step.y / radius)
        vec3$multiplyScalar(vec3$normalize(vec3$applyQuat(origin, tmpQ)), radius)
      } else {
        vec3$multiplyScalar(vec3$normalize(origin), radius)
      }
    } else {
      const radius = Math.hypot(origin.x, origin.y)
      const newRadius = radius + step.x
      if (radius > 0 && newRadius > 0) {
        const x = (origin.x / radius) * newRadius
        const y = (origin.y / radius) * newRadius
        const angle = step.y / newRadius
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        origin.x = x * cos - y * sin
        origin.y = x * sin + y * cos
      }
      origin.z += step.z
    }

    if (q) {
      vec3$applyQuat(origin, q)
    }
    vec3$addScaled(vec3$initFrom(pt.pos, pt.center), origin, 1)
  }

  /**
   * Facing "Shape" (`CParticle::GetRenderMatrix`): the sprite faces away from the emitter. Circles keep the up axis
   * of the emitter, points and spheres face along the direction from the emitter.
   *
   * @returns false if the facing is undefined (the particle sits on the emitter, or a box shape), use free facing then
   */
  private shapeFacing(pt: Particle, vX: IVec3, vY: IVec3, vZ: IVec3): boolean {
    const shape = this.params.emitterShape
    if (shape !== 'CIRCLE' && shape !== 'SPHERE' && shape !== 'POINT') {
      return false
    }
    const emitPos = shape === 'POINT' ? this.location.position : pt.center
    const dir = vec3Subtract(pt.pos, emitPos, vY)
    if (vec3Length(dir) < 1e-6) {
      return false
    }
    vec3$normalize(dir)
    // CreateRotationVDir: y along the direction, x horizontal, z up
    vec3$init(vX, dir.y, -dir.x, 0)
    if (vec3Length(vX) < 1e-6) {
      vec3$init(vX, 1, 0, 0)
    }
    vec3$normalize(vX)
    if (shape === 'CIRCLE') {
      vec3ApplyQuat(AXIS_Z, this.location.rotation, vZ)
    } else {
      vec3Cross(vX, vY, vZ)
    }
    return true
  }

  private updateParticle(pt: Particle, dt: number) {
    if (dt <= 0) {
      return
    }
    const p = this.params
    const loc = this.location
    const age = Math.min(1, (pt.age + dt * 0.5) / pt.stopAge)
    const shape = p.emitterShape

    // shape velocity (point, box …), in emitter space when moving relative to the emitter
    if (shape === 'POINT' || shape === 'BOX' || shape === 'CIRCLE' || shape === 'SPHERE') {
      const rel = this.relativeAge()
      const move = vec3$init(
        tmpA,
        ageValue(p.velocity[0], 1, age) * curveStrength(p.velocity[0], rel) + pt.userVel.x,
        ageValue(p.velocity[1], 1, age) * curveStrength(p.velocity[1], rel) + pt.userVel.y,
        ageValue(p.velocity[2], 1, age) * curveStrength(p.velocity[2], rel) + pt.userVel.z,
      )
      if (shape === 'CIRCLE' || shape === 'SPHERE') {
        this.moveAroundCenter(pt, vec3$multiplyScalar(move, dt))
      } else {
        if (p.moveRelEmitter) {
          vec3$multiplyScalar(vec3$applyQuat(move, loc.rotation), loc.scale)
        }
        vec3$addScaled(pt.pos, move, dt)
      }
    }

    // forces
    const gravity = ageValue(p.gravityScale, pt.gravity, age)
    const accel = vec3$init(tmpA, p.acceleration[0], p.acceleration[1], p.acceleration[2] + GRAVITY * gravity)
    const drag = ageValue(p.airResistance, pt.air, age)
    if (p.turbulence3DSpeed.base) {
      const turbulence = ageValue(p.turbulence3DSpeed, pt.turbulence, age) / Math.sqrt(dt)
      accel.x += random(-1, 1) * turbulence
      accel.y += random(-1, 1) * turbulence
      accel.z += random(-1, 1) * turbulence
    }
    travel(pt.pos, pt.vel, dt, accel, drag)

    if (drag * p.rotationalDragScale > 0) {
      const decay = Math.exp(-drag * p.rotationalDragScale * dt)
      vec3$multiplyScalar(pt.rotVel, decay)
      pt.angleVel *= decay
    }

    // rotation, animated rates are re-evaluated
    if (this.is3DRotation) {
      if (hasAgeCurve(p.rotationRateX) || hasAgeCurve(p.rotationRateY) || hasAgeCurve(p.rotationRateZ)) {
        vec3$applyQuat(this.rotationRate(pt.rotVel, pt, age), pt.rot)
      }
      quat$integrate(pt.rot, pt.rotVel, dt)
    } else {
      if (hasAgeCurve(p.rotationRateY)) {
        pt.angleVel = ageValue(p.rotationRateY, pt.rotateY, age) * DEGREE_TO_RAD
      }
      pt.angle += pt.angleVel * dt
    }
    pt.age += dt
    this.align(pt)
  }

  /**
   * Orients a particle to its facing and velocity, see `CParticle::UpdateAlignment` and `AlignTo`
   */
  private align(pt: Particle) {
    const p = this.params
    let normal: IVec3 = null
    if (p.facing === 'Velocity') {
      normal = vec3Normalize(pt.vel, tmpD)
    } else if (p.facing === 'Horizontal') {
      normal = vec3ApplyQuat(AXIS_Y, this.location.rotation, tmpD)
    }
    if (p.facing !== 'Velocity' && p.orientToVelocity && vec3Length(pt.vel) > 1e-6) {
      const orient = vec3Normalize(pt.vel, tmpE)
      if (normal) {
        vec3$normalize(vec3$addScaled(orient, normal, -vec3Dot(orient, normal)))
      }
      quat$rotateToUp(pt.rot, orient)
      return
    }
    if (normal && vec3Length(normal) > 0) {
      quat$rotateToUp(pt.rot, normal)
    }
  }

  /**
   * Writes the particles to the instance buffer: center, oriented half axes, texture frame and color.
   * See `CParticle::GetRenderMatrix`.
   *
   * @returns the number of written particles
   */
  public writeInstances(out: Float32Array, camera: ParticleCamera): number {
    const p = this.params
    const list = this.particles
    const count = Math.min(list.length, this.capacity)
    const cam = camera.position
    const additive = p.blendType === 'Additive'

    if (!additive && count > 1) {
      for (let i = 0; i < count; i++) {
        list[i].cameraDistance = vec3DistanceSquared(list[i].pos, cam)
      }
      list.sort(byDistanceDesc)
    }

    const tiling = p.textureTiling
    const frames = tiling.animFramesCount
    const spawn = this.spawn
    const vX = tmpA
    const vY = tmpB
    const vZ = tmpC
    const center = tmpD
    let o = 0
    for (let i = 0; i < count; i++) {
      const pt = list[i]
      const age = Math.min(1, pt.age / pt.stopAge)
      const pos = pt.pos

      // axes, vY is the sprite normal, the sprite spans vX (u) and vZ (v)
      if (p.facing === 'Camera') {
        vec3$normalize(vec3Subtract(cam, pos, vY))
        vec3$normalize(vec3$init(vX, vY.y, -vY.x + 1e-6, 0))
        vec3Cross(vX, vY, vZ)
        if (p.orientToVelocity && vec3Length(pt.vel) > 1e-6) {
          // rotate within the camera plane, so z points along the projected velocity
          vec3$addScaled(vec3$initFrom(vZ, pt.vel), vY, -vec3Dot(pt.vel, vY))
          if (vec3Length(vZ) > 1e-6) {
            vec3Cross(vY, vec3$normalize(vZ), vX)
          } else {
            vec3Cross(vX, vY, vZ)
          }
        }
      } else if (p.facing === 'Shape' && this.shapeFacing(pt, vX, vY, vZ)) {
        // axes written by shapeFacing
      } else if (p.facing === 'CameraX') {
        vec3ApplyQuat(AXIS_Z, pt.rot, vZ)
        vec3$normalize(vec3Cross(vec3Subtract(pos, cam, vY), vZ, vX))
        vec3Cross(vZ, vX, vY)
      } else {
        vec3ApplyQuat(AXIS_Z, pt.rot, vZ)
        vec3ApplyQuat(AXIS_X, pt.rot, vX)
        vec3Cross(vZ, vX, vY)
      }

      // planar rotation within the sprite plane
      if (pt.angle) {
        const s = Math.sin(pt.angle)
        const c = Math.cos(pt.angle)
        vec3$initFrom(tmpE, vX)
        vec3$addScaled(vec3$multiplyScalar(vX, c), vZ, -s)
        vec3$addScaled(vec3$multiplyScalar(vZ, c), tmpE, s)
      }

      // CParticle::ApplyCameraNonFacingFade, vY is the unit sprite normal here
      let facingFade = 1
      if (p.cameraNonFacingFade && p.facing !== 'Camera' && p.facing !== 'Decal') {
        const toCam = vec3$normalize(vec3Subtract(cam, pos, tmpE))
        const dot = Math.abs(vec3Dot(toCam, vY))
        facingFade = p.cameraNonFacingFadeCurve ? Math.max(0, p.cameraNonFacingFadeCurve.value(dot)) : dot
      }

      // size, the engine stores the y size as particle size and the x size as aspect
      const sizeY = ageValue(p.sizeY, pt.sizeY, age, pt.lerp)
      const sizeX = ageValue(p.sizeX, pt.sizeX, age, pt.lerp)
      const size = sizeY * pt.sizeScale
      const aspect = Math.abs(sizeY) < 1e-4 ? 0 : sizeX / sizeY
      const scaleX = size * this.texAspectX * aspect * pt.flipX
      const scaleZ = size * this.texAspectY * pt.flipY
      vec3$multiplyScalar(vX, scaleX)
      vec3$multiplyScalar(vZ, scaleZ)

      vec3$initFrom(center, pos)

      // stretch along the velocity
      if (p.stretch.base) {
        let stretch = ageValue(p.stretch, pt.stretch, age)
        if (stretch * (1 - p.stretchOffsetRatio) > pt.age) {
          stretch = pt.age / (1 - p.stretchOffsetRatio)
        }
        const expand = vec3$multiplyScalar(vec3$initFrom(vY, pt.vel), stretch)
        const len = vec3Length(expand)
        if (len > 1e-6) {
          expandAxis(vX, expand, len * Math.abs(scaleX))
          expandAxis(vZ, expand, len * Math.abs(scaleZ))
          vec3$addScaled(center, expand, p.stretchOffsetRatio)
        }
      }

      // pivot (the engine applies the y pivot twice for sprites)
      if (p.pivotX.base) {
        vec3$addScaled(center, vX, ageValue(p.pivotX, pt.pivotX, age))
      }
      if (p.pivotY.base) {
        vec3$addScaled(center, vZ, ageValue(p.pivotY, pt.pivotY, age) * 2)
      }

      // camera distance offset, positive moves away from the camera
      if (p.cameraDistanceOffset) {
        vec3$addScaled(center, vec3$normalize(vec3Subtract(center, cam, vY)), p.cameraDistanceOffset)
      }

      // texture frame
      let tile0 = pt.tile
      let tile1 = pt.tile
      let blend = 0
      if (frames > 1) {
        let animPos: number
        if (tiling.animFramerate > 0) {
          animPos = (pt.age * tiling.animFramerate) / frames
          if (tiling.animCycle === 'Loop') {
            animPos = animPos % 1
          } else if (tiling.animCycle === 'Mirror') {
            animPos = 1 - Math.abs((animPos % 2) - 1)
          } else {
            animPos = Math.min(animPos, 1)
          }
        } else {
          animPos = age
        }
        if (tiling.animCurve) {
          animPos = tiling.animCurve.value(animPos)
        }
        const scale = tiling.animCycle !== 'Once' ? frames : tiling.animBlend ? frames - 1 : frames - 0.001
        const local = animPos * scale
        let f0 = Math.floor(local)
        blend = local - f0
        let f1 = f0 + 1
        if (tiling.animCycle !== 'Once') {
          f0 %= frames
          f1 %= frames
        } else {
          f0 = Math.min(f0, frames - 1)
          f1 = Math.min(f1, frames - 1)
        }
        tile0 += f0
        tile1 += f1
      }

      // color and alpha
      colorValue(tmpColor, p.color, pt.color, age, pt.lerp)
      const alpha = ageValue(p.alpha, pt.alpha, age, pt.lerp) * spawn.alphaScale * facingFade

      // soft particle thickness factor (1 - exp(-d * d * k))
      const thickness = Math.max(1e-3, Math.abs(size) * p.softness)
      const soft = 1 / (thickness * thickness)

      out[o++] = center.x
      out[o++] = center.y
      out[o++] = center.z
      out[o++] = tile0 + Math.min(blend, 0.999)
      out[o++] = vX.x
      out[o++] = vX.y
      out[o++] = vX.z
      out[o++] = tile1
      out[o++] = vZ.x
      out[o++] = vZ.y
      out[o++] = vZ.z
      out[o++] = soft
      out[o++] = tmpColor[0] * spawn.color[0]
      out[o++] = tmpColor[1] * spawn.color[1]
      out[o++] = tmpColor[2] * spawn.color[2]
      out[o++] = Math.max(0, Math.min(1, alpha))
      // relative particle age (IN.age.x of particles.cfi)
      out[o++] = age
      out[o++] = 0
      out[o++] = 0
      out[o++] = 0
    }
    return count
  }

  /**
   * Removes all particles and restarts the emitter
   */
  public reset() {
    for (const pt of this.particles) {
      this.pool.push(pt)
    }
    this.particles.length = 0
    this.age = 0
    this.initialize(0)
  }
}

function byDistanceDesc(a: Particle, b: Particle) {
  return b.cameraDistance - a.cameraDistance
}

/**
 * Value with random variation in both directions: `value + random * (-1..1)`
 */
function varRandom(value: VarParam, random: VarParam, strength: number) {
  return varValue(value, strength) + varValue(random, strength) * (Math.random() * 2 - 1)
}

/**
 * Emitter strength curve value of a vector component (the strength curve of TVarEPParam)
 */
function curveStrength(p: VarParam, strength: number) {
  return p.strength ? p.strength.value(strength) : 1
}

/**
 * Extends an axis in the direction of the stretch, see `ExpandAxis`
 */
function expandAxis(axis: IVec3, expand: IVec3, lengths: number) {
  if (lengths > 1e-12) {
    vec3$addScaled(axis, expand, vec3Dot(expand, axis) / lengths)
  }
}

const travelTerm = vec3()

/**
 * Analytic velocity and position with drag, gravity and no wind, see `Travel::Travel`
 */
function travel(pos: IVec3, vel: IVec3, dt: number, accel: IVec3, drag: number) {
  if (drag * dt >= 0.001) {
    // terminal velocity
    const term = vec3$multiplyScalar(vec3$initFrom(travelTerm, accel), 1 / drag)
    const decay = 1 - Math.exp(-drag * dt)
    const t = decay / drag
    vec3$addScaled(pos, vel, t)
    vec3$addScaled(pos, term, dt - t)
    vec3$addScaled(vel, vec3$subtract(term, vel), decay)
  } else {
    // second order approximation
    const force = vec3$addScaled(vec3$initFrom(travelTerm, accel), vel, -drag)
    vec3$addScaled(pos, vel, dt)
    vec3$addScaled(pos, force, dt * dt * 0.5)
    vec3$addScaled(vel, force, dt)
  }
}

