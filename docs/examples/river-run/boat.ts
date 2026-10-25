import { KeyboardInputSystem, ParticleEmitterComponent, TouchInput, TransformComponent } from '@gglib/components'
import { GameComponent, GameEntity, GameQuery, GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import { KeyboardKeys } from '@gglib/game'
import { Device } from '@gglib/graphics'
import { clamp } from '@gglib/math'
import {
  ACCELERATION,
  BLOCK,
  BOAT_HALF_X,
  BOAT_HALF_Z,
  BRAKING,
  DRAG,
  GRAVITY,
  INVULNERABLE,
  JUMP_POINTS,
  LIVES,
  MAX_SPEED,
  MIN_SPEED,
  RIVER_WIDTH,
  WATER_LEVEL,
} from './constants'
import { ObstacleComponent } from './obstacles'
import { RiverStreamingSystem } from './streaming'

/**
 * The state of the player boat
 */
export class BoatComponent implements GameComponent {
  public readonly entity!: GameEntity

  /**
   * Whether the boat races. Without racing it waits, or coasts out after the last life
   */
  public racing = false

  // input, -1 to 1
  public throttle = 0
  public steer = 0
  /**
   * Space, Enter or a new touch in this frame
   */
  public start = false
  /**
   * The side of the screen the touch controls are on, `1` right or `-1` left. A touch on the left half of the
   * screen moves them to the left
   */
  public controlSide = 1

  public x = 0
  public z = 0
  /**
   * Height above the water, greater than 0 on a ramp and in the air
   */
  public y = 0
  public speed = MIN_SPEED
  public sideSpeed = 0
  public verticalSpeed = 0
  public airTime = 0

  public lives = LIVES
  /**
   * Seconds left in which the boat passes through obstacles
   */
  public invulnerable = 0
  public points = 0
  /**
   * The points of the last jump, set when the boat lands. The game shows and resets them
   */
  public jumpPoints = 0
  /**
   * Seconds the splash emitter is on
   */
  public splashTime = 0

  public constructor(
    /**
     * The transform of the model, it tilts and blinks without moving the emitters
     */
    public readonly model: TransformComponent,
    public readonly wake: ParticleEmitterComponent,
    public readonly splash: ParticleEmitterComponent,
  ) {}

  public reset(x: number, z: number) {
    this.racing = false
    this.x = x
    this.z = z
    this.y = 0
    this.speed = MIN_SPEED
    this.sideSpeed = 0
    this.verticalSpeed = 0
    this.lives = LIVES
    this.invulnerable = 0
    this.points = 0
    this.jumpPoints = 0
  }
}

/**
 * Reads the keyboard and touch input and drives the boats: speed and steering, the shore, ramps and jumps, crashes
 * into obstacles, and how the boat leans, bobs and blinks
 */
export class BoatSystem extends GameSystem {
  public override order: number = SystemOrder.Default

  private boats!: GameQuery
  private obstacles!: GameQuery
  private keyboard!: KeyboardInputSystem
  private touch!: TouchInput
  private streaming!: RiverStreamingSystem
  private canvas!: HTMLCanvasElement
  // the finger that steers, a touch acts like a joystick relative to where it touched down
  private readonly touchStart = { active: false, id: 0, x: 0, y: 0 }

  public initialize(world: GameWorld): void {
    this.boats = world.query({ scope: 'active', required: [BoatComponent] })
    this.obstacles = world.query({ scope: 'active', required: [ObstacleComponent] })
    this.keyboard = world.getSystem(KeyboardInputSystem)
    this.touch = world.getSystem(TouchInput)
    this.streaming = world.getSystem(RiverStreamingSystem)
    this.canvas = world.getSystem(Device).canvas as HTMLCanvasElement
  }

  public destroy(): void {
    //
  }

  public override update(time: number, dt: number): void {
    dt = Math.min(dt, 0.05)
    for (const entity of this.boats) {
      const boat = entity.$(BoatComponent)
      this.readInput(boat)
      if (boat.racing) {
        this.drive(boat, dt)
      } else if (boat.lives <= 0) {
        // coasts out after the last life
        boat.speed = Math.max(0, boat.speed - 8 * dt)
        boat.z += boat.speed * dt
      }
      this.updateTransform(boat, entity.$(TransformComponent), time, dt)
    }
  }

  private readInput(boat: BoatComponent) {
    const keys = this.keyboard
    let throttle = 0
    let steer = 0
    if (keys.isPressed(KeyboardKeys.ArrowUp) || keys.isPressed(KeyboardKeys.KeyW)) {
      throttle += 1
    }
    if (keys.isPressed(KeyboardKeys.ArrowDown) || keys.isPressed(KeyboardKeys.KeyS)) {
      throttle -= 1
    }
    if (keys.isPressed(KeyboardKeys.ArrowLeft) || keys.isPressed(KeyboardKeys.KeyA)) {
      steer -= 1
    }
    if (keys.isPressed(KeyboardKeys.ArrowRight) || keys.isPressed(KeyboardKeys.KeyD)) {
      steer += 1
    }
    let start = keys.justPressed(KeyboardKeys.Space) || keys.justPressed(KeyboardKeys.Enter)

    const touch = this.touchStart
    const ids = this.touch.touchIds
    const id = touch.active && ids.includes(touch.id) ? touch.id : ids.length ? ids[0] : -1
    if (id < 0) {
      touch.active = false
    } else {
      const x = this.touch.x(id)!
      const y = this.touch.y(id)!
      if (!touch.active || touch.id !== id) {
        touch.active = true
        touch.id = id
        touch.x = x
        touch.y = y
        start = true
        // the touch coordinates are in CSS pixels of the canvas
        boat.controlSide = x < this.canvas.clientWidth / 2 ? -1 : 1
      }
      steer += clamp((x - touch.x) / 50, -1, 1)
      throttle += clamp((touch.y - y) / 50, -1, 1)
    }
    boat.throttle = clamp(throttle, -1, 1)
    boat.steer = clamp(steer, -1, 1)
    boat.start = start
  }

  private drive(boat: BoatComponent, dt: number) {
    const airborne = boat.y > 0.01 && !this.rampBelow(boat)
    if (!airborne) {
      // full throttle accelerates, braking is faster, without input the boat slowly loses speed
      const throttle = boat.throttle
      const change = throttle > 0 ? ACCELERATION * throttle : throttle < 0 ? BRAKING * throttle : -DRAG
      boat.speed = clamp(boat.speed + change * dt, MIN_SPEED, MAX_SPEED)
      // the camera looks along +z, so +x is on the left of the screen
      const target = -boat.steer * (5 + boat.speed * 0.3)
      boat.sideSpeed += (target - boat.sideSpeed) * Math.min(1, dt * 8)
    }

    const lastX = boat.x
    boat.x += boat.sideSpeed * dt
    boat.z += boat.speed * dt
    // faster driving scores more per unit of distance
    boat.points += boat.speed * dt * (1 + (2 * boat.speed) / MAX_SPEED)
    this.collideWithShore(boat, lastX, dt)
    this.updateHeight(boat, dt)
    boat.invulnerable = Math.max(0, boat.invulnerable - dt)
    if (!boat.invulnerable) {
      this.collideWithObstacles(boat)
    }
  }

  /**
   * The boat stays on the water. Scraping along the shore slows it down, so does a step of the bank where the river
   * curves, the boat is pushed aside. Driving head on into land is a crash
   */
  private collideWithShore(boat: BoatComponent, lastX: number, dt: number) {
    if (boat.y > 0.5 || !this.onLand(boat.x, boat.z)) {
      return
    }
    if (!this.onLand(lastX, boat.z)) {
      boat.x = lastX
      this.scrape(boat, dt)
      return
    }
    // a step of the bank is one block wide, push the boat towards the river center
    const direction = Math.sign(this.streaming.river.centerX(boat.z) - boat.x)
    for (let push = 0.25; push <= BLOCK; push += 0.25) {
      if (!this.onLand(boat.x + direction * push, boat.z)) {
        boat.x += direction * push
        this.scrape(boat, dt)
        return
      }
    }
    // head on, e.g. into the tip of an island: crash and move to the nearest water
    this.crash(boat)
    for (let offset = 0.5; offset < RIVER_WIDTH * 2; offset += 0.5) {
      if (!this.onLand(boat.x - offset, boat.z)) {
        boat.x -= offset
        return
      }
      if (!this.onLand(boat.x + offset, boat.z)) {
        boat.x += offset
        return
      }
    }
  }

  private scrape(boat: BoatComponent, dt: number) {
    boat.sideSpeed = 0
    boat.speed = Math.max(MIN_SPEED, boat.speed - 10 * dt)
  }

  /**
   * Whether a corner of the boat is on land
   */
  private onLand(x: number, z: number) {
    const river = this.streaming.river
    return (
      river.groundAt(x - BOAT_HALF_X, z - BOAT_HALF_Z) !== 'water' ||
      river.groundAt(x + BOAT_HALF_X, z - BOAT_HALF_Z) !== 'water' ||
      river.groundAt(x - BOAT_HALF_X, z + BOAT_HALF_Z) !== 'water' ||
      river.groundAt(x + BOAT_HALF_X, z + BOAT_HALF_Z) !== 'water'
    )
  }

  /**
   * Height of a ramp below the boat, 0 if there is none. The ramps rise along +z
   */
  private rampBelow(boat: BoatComponent): number {
    for (const entity of this.obstacles) {
      const ramp = entity.$(ObstacleComponent).data
      if (!ramp || ramp.kind !== 'ramp') {
        continue
      }
      const along = boat.z - (ramp.z - ramp.halfZ)
      if (Math.abs(boat.x - ramp.x) < ramp.halfX && along > 0 && along < ramp.halfZ * 2) {
        return (along / (ramp.halfZ * 2)) * ramp.height
      }
    }
    return 0
  }

  /**
   * Drives up the ramps, jumps off their end and falls back onto the water. A jump scores points
   */
  private updateHeight(boat: BoatComponent, dt: number) {
    const ramp = this.rampBelow(boat)
    if (ramp > 0 && ramp >= boat.y - 0.1) {
      // on the ramp, the height change gives the vertical speed when leaving it
      boat.verticalSpeed = (ramp - boat.y) / dt
      boat.y = ramp
      boat.airTime = 0
      return
    }
    if (boat.y <= 0) {
      return
    }
    boat.airTime += dt
    boat.verticalSpeed -= GRAVITY * dt
    boat.y += boat.verticalSpeed * dt
    if (boat.y <= 0) {
      boat.y = 0
      boat.verticalSpeed = 0
      boat.splashTime = 0.15
      if (boat.airTime > 0.3) {
        boat.jumpPoints = Math.round(boat.speed * JUMP_POINTS)
        boat.points += boat.jumpPoints
      }
    }
  }

  private collideWithObstacles(boat: BoatComponent) {
    for (const entity of this.obstacles) {
      const it = entity.$(ObstacleComponent).data
      if (!it || it.kind === 'ramp' || boat.y >= it.height) {
        continue
      }
      if (Math.abs(boat.x - it.x) < BOAT_HALF_X + it.halfX && Math.abs(boat.z - it.z) < BOAT_HALF_Z + it.halfZ) {
        this.crash(boat)
        return
      }
    }
  }

  /**
   * A crash costs a life and most of the speed. The boat then passes through obstacles for a while
   */
  private crash(boat: BoatComponent) {
    boat.lives--
    boat.speed = MIN_SPEED
    boat.sideSpeed = 0
    boat.invulnerable = INVULNERABLE
    boat.splashTime = 0.25
    if (boat.lives <= 0) {
      boat.racing = false
      boat.invulnerable = 0
    }
  }

  private updateTransform(boat: BoatComponent, transform: TransformComponent, time: number, dt: number) {
    const floating = boat.y <= 0.01
    const bob = floating ? Math.sin(time * 4) * 0.04 : 0
    // lean into the turn, nose up in the air
    const roll = floating ? -boat.sideSpeed * 0.03 : 0
    const pitch = floating ? -boat.speed * 0.004 : clamp(-boat.verticalSpeed * 0.05, -0.4, 0.4)
    const yaw = Math.atan2(boat.sideSpeed, Math.max(boat.speed, 1)) * 0.5
    transform.setPosition(boat.x, WATER_LEVEL + boat.y + bob, boat.z)
    boat.model.setRotationYawPitchRoll(yaw, pitch, roll)
    // blinks while invulnerable. Seen from above, a jump shows by the boat getting bigger
    const visible = boat.invulnerable === 0 || Math.floor(boat.invulnerable * 10) % 2 === 0
    boat.model.setScaleUniform(visible ? 1 + boat.y * 0.15 : 0)

    boat.wake.frequency = floating && boat.speed > 0 ? 25 + 50 * (boat.speed / MAX_SPEED) : 0
    boat.splashTime -= dt
    boat.splash.frequency = boat.splashTime > 0 ? 300 : 0
  }
}
