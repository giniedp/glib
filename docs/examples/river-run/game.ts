import {
  BehaviorComponent,
  CameraComponent,
  CopyRotationConstraint,
  EcsGame,
  KeyboardInputSystem,
  ModelComponent,
  ParticleEmitterComponent,
  ParticleSystem,
  SpriteComponent,
  TouchInput,
  TransformComponent,
} from '@gglib/components'
import { GameComponent, GameEntity, GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import { Color, CommonInputs, Device, PlatformId, Texture } from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { clamp, lerp, vec3, vec3Normalize, vec4 } from '@gglib/math'
import { opaquePass, RenderChannel, Renderer, transparentPass } from '@gglib/render'
import { mount } from 'tweak-ui'
import { BoatComponent, BoatSystem } from './boat'
import {
  BLOCK,
  FOV,
  LIVES,
  MAX_FIT_ASPECT,
  MAX_SPEED,
  MIN_SPEED,
  MODELS,
  PARKED_Y,
  PITCH_FAST,
  PITCH_SLOW,
  POPUP_TIME,
  RIVER_SCREEN_WIDTH,
  RIVER_WIDTH,
  STATUS,
} from './constants'
import { TrafficSystem } from './obstacles'
import { rowZ } from './river'
import { RiverStreamingSystem } from './streaming'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new RiverRunGame({
    canvas,
    platform,
    autosize: true,
  })

  game.run()
  const panel = mount(tools, (ui) => {
    ui.button('Restart', { onClick: () => game.restart() })
  })

  return () => {
    game.destroy()
    panel.dispose()
  }
}

type State = keyof typeof STATUS

/**
 * A sprite of a sprite sheet: the texture and the source rectangle in pixels
 */
interface SheetSprite {
  texture: Texture
  x: number
  y: number
  width: number
  height: number
}

/**
 * An endless river race. The game wires up systems and entities and runs the race: start, game over, restart,
 * the HUD and the points of a jump. The boat, the traffic, the camera and the streaming of the river are systems.
 *
 * The update loop does not allocate: rows, obstacles and their entities are recycled, the HUD and the points of a
 * jump are created once. New objects are only created while the pools grow at the start of a race
 */
class RiverRunGame extends EcsGame {
  public readonly hud = {
    status: STATUS.ready,
    score: 0,
    speed: MIN_SPEED,
    lives: LIVES,
  }

  private state: State = 'ready'
  private overTime = 0
  private readonly cameraSystem = new RaceCameraSystem()
  private readonly streaming = new RiverStreamingSystem()
  private camera!: CameraComponent
  private boat!: BoatComponent

  // the sprites of the sprite sheets by name, and the ones the HUD uses
  private readonly sprites = new Map<string, SheetSprite>()
  private readonly digitSprites: SheetSprite[] = []
  private plusSprite!: SheetSprite
  private lifeSprite!: SheetSprite
  private lostLifeSprite!: SheetSprite
  private padSprite!: SheetSprite
  private nubSprite!: SheetSprite
  private readonly scoreDigits: SpriteComponent[] = []
  private readonly lifeIcons: SpriteComponent[] = []
  // the joystick in a bottom corner: shows the input of the keys or the finger
  private readonly joystickPad = new SpriteComponent()
  private readonly joystickNub = new SpriteComponent()
  // the digits of a number, most significant first
  private readonly digits: number[] = []
  private popup!: PopupComponent

  protected override onCreate(): void {
    this.world.addSystem(new KeyboardInputSystem({}))
    this.world.addSystem(new TouchInput({ eventTarget: this.device.canvas }))
    this.world.getSystem(TouchInput).touch.preventDefault = true
    this.world.addSystem(new BoatSystem())
    this.world.addSystem(new TrafficSystem())
    this.world.addSystem(this.cameraSystem)
    this.world.addSystem(this.streaming)
    this.world.addSystem(new ParticleSystem(this.device))
    this.world.addSystem(
      new Renderer(this.device, {
        pipeline: {
          passes: [opaquePass(), transparentPass()],
        },
        // no HDR post processing, so 8 bit color is enough and needs half the memory bandwidth
        channels: {
          [RenderChannel.Color]: { format: 'rgba8unorm' },
          [RenderChannel.ColorMsaa]: { format: 'rgba8unorm', sampleCount: 4 },
        },
      }),
    )
  }

  protected override onInitialize(): void {
    this.content.registerLoader(GLTF.Loader)

    const renderer = this.world.getSystem(Renderer)
    renderer.inputs.set(CommonInputs.Global.AmbientColor, Color.SlateGray)
    renderer.inputs.set(CommonInputs.Global.AmbientColorTop, Color.White)
    renderer.inputs.set(CommonInputs.Global.AmbientDirection, vec3Normalize(vec3(0.5, 1, -0.3)))

    this.camera = this.createEntity({
      name: 'Camera',
      parent: this.scene.entity,
      components: [new CameraComponent({ type: 'perspective', perspectiveFov: FOV, far: 400 })],
    }).$(CameraComponent)
    this.scene.setCamera(0, this.camera)

    createParticleChannels(this.world.getSystem(ParticleSystem), this.device)
    this.boat = this.createBoat()
    this.cameraSystem.follow(this.camera, this.boat)
  }

  protected override async onLoadContent() {
    await Promise.all([
      this.loadSheet('/sprites/fish.png', '/sprites/fish.sheet.json'),
      this.loadSheet('/sprites/interface.png', '/sprites/interface.sheet.json'),
      this.loadSheet('/sprites/mobile.png', '/sprites/mobile.sheet.json'),
    ])
    for (let i = 0; i < 10; i++) {
      this.digitSprites.push(this.sprites.get(`hud_number_${i}`)!)
    }
    this.plusSprite = this.sprites.get('hud_plus')!
    this.lifeSprite = this.sprites.get('minimapIcon_jewelRed')!
    this.lostLifeSprite = this.sprites.get('minimapIcon_jewelWhite')!
    this.padSprite = this.sprites.get('joystick_circle_pad_a')!
    this.nubSprite = this.sprites.get('joystick_circle_nub_a')!
    this.createHud()
    this.createPopup()
    this.restart()
  }

  private createBoat(): BoatComponent {
    const entity = this.createEntity({
      name: 'Player',
      parent: this.scene.entity,
    })
    const model = this.createEntity({
      parent: entity,
      transform: new TransformComponent({ position: vec3(0, -0.1, 0) }),
      components: [new ModelComponent()],
    })
    this.content.loadModel(MODELS.boat).then((loaded) => {
      model.$(ModelComponent).model = loaded.instantiate()
    })

    const wake = new ParticleEmitterComponent({
      channel: 'wake',
      frequency: 0,
      inheritVelocity: 0,
    })
    this.createEntity({
      name: 'wake',
      parent: entity,
      transform: new TransformComponent({ position: vec3(0, 0.1, -1.6) }),
      components: [wake],
    })

    const splash = new ParticleEmitterComponent({
      channel: 'splash',
      frequency: 0,
      inheritVelocity: 0.2,
    })
    this.createEntity({
      name: 'splash',
      parent: entity,
      transform: new TransformComponent({ position: vec3(0, 0.2, 0.5) }),
      components: [splash],
    })

    const boat = new BoatComponent(model.$(TransformComponent), wake, splash)
    entity.addComponent(boat)
    return boat
  }

  public restart() {
    this.streaming.restart(Math.floor(Math.random() * 1e9))
    this.boat.reset(0, rowZ(3))
    this.cameraSystem.reset()
    this.setState('ready')
  }

  private setState(state: State) {
    this.state = state
    this.hud.status = STATUS[state]
  }

  /**
   * Runs the race. Called before the systems update, it sees the input and the boat of the last frame
   */
  protected override onUpdate(time: number, dt: number): void {
    const boat = this.boat
    switch (this.state) {
      case 'ready':
        if (boat.throttle > 0 || boat.start) {
          boat.racing = true
          this.setState('running')
        }
        break
      case 'running':
        if (boat.lives <= 0) {
          this.overTime = 0
          this.setState('over')
        }
        break
      case 'over':
        this.overTime += dt
        if (this.overTime > 1 && boat.start) {
          this.restart()
        }
        break
    }
    if (boat.jumpPoints) {
      this.showPoints(boat.jumpPoints)
      boat.jumpPoints = 0
    }
    this.updateHud()
  }

  /**
   * Loads a sprite sheet: a texture and named source rectangles. The sheets come in two formats, a list of
   * rectangles with a name or an object with the rectangles by name
   */
  private async loadSheet(image: string, sheet: string) {
    type Rect = { x: number; y: number; width: number; height: number }
    const texture = await this.content.loadTexture(image)
    const response = await this.content.fetch<Array<Rect & { name: string }> | { sprites: Record<string, Rect> }>(
      sheet,
      { responseType: 'json' },
    )
    const body = response.body
    const rects = Array.isArray(body) ? body.map((it) => [it.name, it] as const) : Object.entries(body?.sprites ?? {})
    for (const [name, { x, y, width, height }] of rects) {
      this.sprites.set(name, { texture, x, y, width, height })
    }
  }

  private setSprite(sprite: SpriteComponent, it: SheetSprite) {
    sprite.setTexture(it.texture, it.x, it.y, it.width, it.height)
  }

  /**
   * Score digits and lives are sprites on a plane in front of the camera, so they stay on screen
   */
  private createHud() {
    const hud = this.createEntity({
      name: 'HUD',
      parent: this.camera.entity,
      // the camera looks along -z
      transform: new TransformComponent({ position: vec3(0, 0, -1) }),
    })
    for (let i = 0; i < 8; i++) {
      const sprite = new SpriteComponent()
      this.createEntity({ parent: hud, components: [sprite] })
      this.scoreDigits.push(sprite)
      this.digits.push(0)
    }
    for (let i = 0; i < LIVES; i++) {
      const sprite = new SpriteComponent()
      this.createEntity({ parent: hud, components: [sprite] })
      this.lifeIcons.push(sprite)
    }
    this.setSprite(this.joystickPad, this.padSprite)
    this.setSprite(this.joystickNub, this.nubSprite)
    this.createEntity({ parent: hud, components: [this.joystickPad] })
    this.createEntity({ parent: hud, components: [this.joystickNub] })
  }

  private updateHud() {
    const boat = this.boat
    const score = Math.floor(boat.points)
    this.hud.score = score
    this.hud.speed = Math.round(boat.speed * 10) / 10
    this.hud.lives = boat.lives

    // the HUD plane is 1 unit in front of the camera
    const halfHeight = Math.tan(FOV / 2)
    const halfWidth = halfHeight * this.device.output.aspectRatio
    const over = this.state === 'over'
    const size = halfHeight * (over ? 0.3 : 0.14)
    const advance = size * 0.62
    const count = this.toDigits(score)
    // top left while racing, centered after the game is over
    const left = over ? (-count * advance) / 2 + advance / 2 : -halfWidth + size * 0.7
    const top = over ? 0 : halfHeight - size * 0.7
    for (let i = 0; i < this.scoreDigits.length; i++) {
      const sprite = this.scoreDigits[i]
      this.setSprite(sprite, this.digitSprites[i < count ? this.digits[i] : 0])
      sprite.setSize(i < count ? size : 0)
      sprite.entity.$(TransformComponent).setPosition(left + i * advance, top, 0)
    }
    // below the score, the lost lives are white
    const icon = halfHeight * 0.09
    for (let i = 0; i < this.lifeIcons.length; i++) {
      const sprite = this.lifeIcons[i]
      this.setSprite(sprite, i < boat.lives ? this.lifeSprite : this.lostLifeSprite)
      sprite.setSize(over ? 0 : icon)
      sprite.entity.$(TransformComponent).setPosition(-halfWidth + size * 0.55 + i * icon * 1.2, top - size * 0.75, 0)
    }
    this.updateJoystick(halfWidth, halfHeight, over)
  }

  /**
   * The joystick in the bottom corner on the side of the last touch, bottom right by default. The nub shows the
   * input, of the keys or the finger
   */
  private updateJoystick(halfWidth: number, halfHeight: number, hidden: boolean) {
    const boat = this.boat
    // at most a quarter of the screen width, the HUD plane is 2 * halfWidth wide
    const pad = Math.min(halfHeight * 0.36, halfWidth * 0.5)
    const margin = Math.min(halfHeight, halfWidth) * 0.08
    const x = boat.controlSide * (halfWidth - margin - pad / 2)
    const y = -halfHeight + margin + pad / 2
    this.joystickPad.setSize(hidden ? 0 : pad)
    this.joystickPad.entity.$(TransformComponent).setPosition(x, y, 0)
    // in front of the pad, steering right moves the nub right, throttle moves it up
    const reach = pad * 0.3
    this.joystickNub.setSize(hidden ? 0 : pad * 0.5)
    this.joystickNub.entity.$(TransformComponent).setPosition(x + boat.steer * reach, y + boat.throttle * reach, 0.001)
  }

  /**
   * The points of a jump: a plus and up to three digits that face the camera. Created once and reused
   */
  private createPopup() {
    this.popup = new PopupComponent()
    const entity = this.createEntity({
      name: 'Popup',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, PARKED_Y, 0) }),
      components: [
        new CopyRotationConstraint({
          source: this.camera.entity.$(TransformComponent),
          sourceSpace: 'world',
          targetSpace: 'world',
        }),
        this.popup,
      ],
    })
    for (let i = 0; i < 4; i++) {
      // a texture of the sheet from the start, so the glyphs share the batch of the HUD digits
      const sprite = new SpriteComponent().setSize(0)
      this.setSprite(sprite, this.plusSprite)
      this.createEntity({ parent: entity, components: [sprite] })
      this.popup.glyphs.push(sprite)
    }
  }

  /**
   * Shows the points of a jump above the boat: a plus and the digits
   */
  private showPoints(points: number) {
    const glyphs = this.popup.glyphs
    const count = this.toDigits(points)
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i]
      if (i > count) {
        glyph.setSize(0)
        continue
      }
      this.setSprite(glyph, i === 0 ? this.plusSprite : this.digitSprites[this.digits[i - 1]])
      glyph.setSize(1.2)
      glyph.entity.$(TransformComponent).setPosition((i - count / 2) * 0.75, 0, 0)
    }
    this.popup.show(this.boat.x, this.boat.z, this.boat.speed)
  }

  /**
   * Writes the digits of a whole number into `digits`, returns their count
   */
  private toDigits(value: number) {
    const digits = this.digits
    let count = 1
    for (let rest = Math.floor(value / 10); rest > 0 && count < digits.length; rest = Math.floor(rest / 10)) {
      count++
    }
    let rest = value
    for (let i = count - 1; i >= 0; i--) {
      digits[i] = rest % 10
      rest = Math.floor(rest / 10)
    }
    return count
  }
}

// +z is the top of the screen, also when the camera looks straight down
const SCREEN_UP = vec3(0, 0, 1)

/**
 * A top down view that follows the boat. The river keeps its share of the screen width, the camera moves further
 * away on narrow screens. Screens wider than {@link MAX_FIT_ASPECT} show more scenery on the sides instead. A slow boat is near the bottom edge of the screen and the camera looks straight down,
 * at full speed the boat moves up to the center and the camera tilts forward.
 *
 * Runs after the boat moved and before the camera computes its view. Tells the streaming system which part of the
 * river is on the screen
 */
class RaceCameraSystem extends GameSystem {
  public override order: number = SystemOrder.Default + 2

  private camera!: CameraComponent
  private boat!: BoatComponent
  private streaming!: RiverStreamingSystem
  private device!: Device
  private readonly target = vec3()
  // smoothed position of the boat on the screen, 0 at the bottom when slow, 1 at the center when fast
  private screenPosition = 0

  public follow(camera: CameraComponent, boat: BoatComponent) {
    this.camera = camera
    this.boat = boat
  }

  public reset() {
    this.screenPosition = 0
  }

  public initialize(world: GameWorld): void {
    this.streaming = world.getSystem(RiverStreamingSystem)
    this.device = world.getSystem(Device)
  }

  public destroy(): void {
    //
  }

  public override update(time: number, dt: number): void {
    const aspect = this.device.output.aspectRatio
    this.camera.aspect = aspect
    const distance = RIVER_WIDTH / RIVER_SCREEN_WIDTH / (Math.tan(FOV / 2) * Math.min(aspect, MAX_FIT_ASPECT))
    // the widest part of the screen on the water: its top edge, when the camera is tilted the most. Rows are placed
    // at the top edge, so they are wide enough for any tilt
    const topDistance = (distance * Math.sin(PITCH_FAST)) / Math.sin(PITCH_FAST - FOV / 2)
    this.streaming.viewHalfWidth = topDistance * Math.sin(FOV / 2) * aspect + 2 * BLOCK

    const t = clamp((this.boat.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1)
    this.screenPosition += (t - this.screenPosition) * Math.min(1, dt * 2)
    const pitch = lerp(PITCH_SLOW, PITCH_FAST, this.screenPosition)
    const height = distance * Math.sin(pitch)
    const back = distance * Math.cos(pitch)
    // the bottom and top edge of the screen on the water, relative to the point the camera looks at.
    // The ray through the bottom edge points down and backwards when the camera looks straight down
    const bottomRay = pitch + FOV / 2
    const topRay = pitch - FOV / 2
    const bottom = -back + (height * Math.cos(bottomRay)) / Math.sin(bottomRay)
    const top = -back + (height * Math.cos(topRay)) / Math.sin(topRay)
    // a slow boat is 3 units above the bottom edge, a fast boat at the center
    const focus = this.boat.z + lerp(-bottom - 3, 0, this.screenPosition)
    // follows the curves of the river
    const x = this.streaming.river.centerX(focus)

    this.target.x = x
    this.target.y = 0
    this.target.z = focus
    const transform = this.camera.entity.$(TransformComponent)
    transform.setPosition(x, height, focus - back)
    transform.lookAt(this.target, SCREEN_UP)

    this.streaming.viewBottom = focus + bottom
    this.streaming.viewTop = focus + top
  }
}

/**
 * Lets the points of a jump rise with the boat for a moment, then hides them
 */
class PopupComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public readonly glyphs: SpriteComponent[] = []
  private age = POPUP_TIME
  private speed = 0

  public show(x: number, z: number, speed: number) {
    this.age = 0
    this.speed = speed
    this.entity.$(TransformComponent).setPosition(x, 2.5, z)
  }

  public updateBehavior(time: number, dt: number): void {
    if (this.age >= POPUP_TIME) {
      return
    }
    this.age += dt
    this.entity.$(TransformComponent).translate(0, dt * 2, this.speed * dt)
    if (this.age >= POPUP_TIME) {
      for (let i = 0; i < this.glyphs.length; i++) {
        this.glyphs[i].setSize(0)
      }
    }
  }
}

/**
 * The wake behind the boat and the splash after a jump or a crash
 */
function createParticleChannels(particles: ParticleSystem, device: Device) {
  // the wake spreads on the water behind the boat, the particles stay where they were emitted
  particles.addChannel('wake', {
    maxParticles: 1500,
    texture: discTexture(device),
    duration: 1.2,
    durationRandomness: 0.2,
    minColor: vec4(0.75, 0.88, 1, 0.9),
    maxColor: vec4(0.92, 0.97, 1, 0.9),
    minStartSize: 0.15,
    maxStartSize: 0.2,
    minEndSize: 0.4,
    maxEndSize: 0.55,
    minHorizontalVelocity: 0.3,
    maxHorizontalVelocity: 1.2,
    endVelocity: 0.4,
    fadeIn: 0.02,
    fadeOut: 0.5,
  })
  particles.addChannel('splash', {
    maxParticles: 500,
    texture: discTexture(device),
    duration: 0.8,
    durationRandomness: 0.3,
    minColor: vec4(0.85, 0.94, 1, 0.95),
    maxColor: vec4(1, 1, 1, 0.95),
    minStartSize: 0.15,
    maxStartSize: 0.25,
    minEndSize: 0.08,
    maxEndSize: 0.15,
    minHorizontalVelocity: 1.5,
    maxHorizontalVelocity: 3.5,
    minVerticalVelocity: 2.5,
    maxVerticalVelocity: 5,
    gravity: vec3(0, -12, 0),
    endVelocity: 0.6,
    fadeIn: 0.02,
    fadeOut: 0.3,
  })
}

/**
 * A white disc with a hard edge, for the wake and splash particles
 */
function discTexture(device: Device, size = 16) {
  const data = new Uint8Array(size * size * 4)
  const r = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = Math.hypot(x + 0.5 - r, y + 0.5 - r) <= r
      data.set([255, 255, 255, inside ? 255 : 0], (y * size + x) * 4)
    }
  }
  return device.createTexture({
    name: 'Particle Disc',
    source: data,
    width: size,
    height: size,
    format: 'rgba8unorm',
    generateMipmap: false,
  })
}
