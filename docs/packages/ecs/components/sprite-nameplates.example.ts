import {
  BehaviorComponent,
  CameraComponent,
  CopyRotationConstraint,
  EcsGame,
  LightComponent,
  ModelComponent,
  SpriteComponent,
  TransformComponent,
} from '@gglib/components'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { Color, CommonInputs, Device, PlatformId, Texture } from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { clamp, DEGREE_TO_RAD, lerp, quatCreateAxisAngle, vec3, vec3Normalize } from '@gglib/math'
import { AnimationPlayer, Model } from '@gglib/model'
import { Renderer } from '@gglib/render'
import { mount } from 'tweak-ui'

const settings = {
  orbit: true,
  plateScale: 1.5,
}

const characters = [
  { name: 'Fennec', model: 'animal-fox' },
  { name: 'Bessie the Brave', model: 'animal-cow' },
  { name: 'Waddles', model: 'animal-penguin' },
  { name: 'Truffle', model: 'animal-pig' },
  { name: 'Jumbo', model: 'animal-elephant' },
]

const BLOCKS = '/models/gltf/blocks/'
const ANIMALS = '/models/gltf/cube-animals/'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })
  game.run()

  const panel = mount(tools, (ui) => {
    ui.bool(settings, 'orbit', { label: 'Orbit camera' })
    ui.scalar(settings, 'plateScale', { label: 'Plate scale', range: true, min: 0.25, max: 3, step: 0.01 })
    ui.button('Hit everyone', { onClick: () => game.hitAll() })
  })
  return () => {
    game.destroy()
    panel.dispose()
  }
}

class Game extends EcsGame {
  private camera!: CameraComponent
  private cameraAngle = 0
  private plates: NameplateComponent[] = []
  private models = new Map<string, Promise<Model>>()

  protected override onInitialize(): void {
    this.content.registerLoader(GLTF.Loader)

    const renderer = this.world.getSystem(Renderer)
    renderer.inputs.set(CommonInputs.Global.AmbientColor, Color.DimGray)
    renderer.inputs.set(CommonInputs.Global.AmbientColorTop, Color.White)
    renderer.inputs.set(CommonInputs.Global.AmbientDirection, vec3Normalize(vec3(0.5, 1, 0.3)))

    this.createEntity({
      name: 'light',
      parent: this.scene.entity,
      transform: new TransformComponent({ rotation: quatCreateAxisAngle(vec3(1, 0.4, 0), -50 * DEGREE_TO_RAD) }),
      components: [new LightComponent()],
    })

    const camera = this.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      transform: new TransformComponent(),
      components: [new CameraComponent({ type: 'perspective' })],
    })
    this.camera = camera.component(CameraComponent)
    this.scene.setCamera(0, this.camera)

    this.createScenery()

    // all names are drawn into one texture, so all name sprites are one draw call
    const names = createNameAtlas(
      this.device,
      characters.map((it) => it.name),
    )
    characters.forEach((it, i) => this.createCharacter(it.model, names.texture, names.rects[i], i))
  }

  /**
   * Loads each model once, each placement is an instance of it
   */
  private loadModel(url: string) {
    let model = this.models.get(url)
    if (!model) {
      model = this.content.loadModel(url)
      this.models.set(url, model)
    }
    return model
  }

  /**
   * Places a model. The block models are 2 units wide and centered
   */
  private place(url: string, x: number, y: number, z: number, scale = 1, angle = 0, parent?: GameEntity) {
    const entity = this.createEntity({
      parent: parent ?? this.scene.entity,
      transform: new TransformComponent({
        position: vec3(x, y, z),
        rotation: quatCreateAxisAngle(vec3(0, 1, 0), angle),
        scale: vec3(scale),
      }),
      components: [new ModelComponent()],
    })
    this.loadModel(url).then((model) => {
      // placements share meshes and materials, the renderer draws them as instances
      entity.component(ModelComponent).model = model.instantiate()
    })
    return entity
  }

  private createScenery() {
    // a 12x12 field of blocks, the top is at y = 0. A pond in one corner with a sand shore
    const size = 12
    for (let ix = 0; ix < size; ix++) {
      for (let iz = 0; iz < size; iz++) {
        const x = (ix - size / 2 + 0.5) * 2
        const z = (iz - size / 2 + 0.5) * 2
        const pond = Math.hypot(x - 8, z + 8)
        if (pond < 4) {
          this.place(`${BLOCKS}water.gltf`, x, -1.4, z)
        } else if (pond < 6) {
          this.place(`${BLOCKS}sand_A.gltf`, x, -1, z)
        } else {
          this.place(`${BLOCKS}grass.gltf`, x, -1, z)
        }
      }
    }

    // props are half a block, stacked on the field
    const props: Array<[string, number, number, number?]> = [
      ['crate', -9, 9],
      ['crate', -8, 9],
      ['crate', -8.5, 9, 1],
      ['barrel', -10, 7],
      ['hay_bale', 9, 9],
      ['hay_bale', 10, 8],
      ['hay_bale', 9.5, 8.5, 1],
      ['stone', -10, -10],
      ['stone', -9, -10],
      ['stone_dark', -10, -9],
      ['melon', 4, 10],
      ['apple', 5, 10.5],
    ]
    for (const [name, x, z, level = 0] of props) {
      this.place(`${BLOCKS}${name}.gltf`, x, 0.5 + level, z, 0.5, Math.random() * 0.4)
    }

    // trees: a trunk of two wood blocks and a full block of leaves
    for (const [x, z] of [
      [-10, -3],
      [-10, 3],
      [3, -10],
      [10, 2],
    ]) {
      this.place(`${BLOCKS}wood.gltf`, x, 0.5, z, 0.5)
      this.place(`${BLOCKS}wood.gltf`, x, 1.5, z, 0.5)
      this.place(`${BLOCKS}tree.gltf`, x, 3, z)
    }
  }

  private createCharacter(model: string, names: Texture, rect: NameRect, index: number) {
    const cameraTransform = this.camera.entity.getTransform<TransformComponent>()!

    // the root moves, the body turns towards the walking direction, the plate faces the camera
    const root = this.createEntity({
      name: 'character',
      parent: this.scene.entity,
      transform: new TransformComponent(),
    })
    const body = this.createEntity({
      parent: root,
      transform: new TransformComponent(),
      components: [new ModelComponent()],
    })
    const plate = this.createEntity({
      name: 'nameplate',
      parent: root,
      transform: new TransformComponent({ position: vec3(0, 2.3, 0) }),
      components: [
        // copies the camera rotation, so the plate is parallel to the screen
        new CopyRotationConstraint({ source: cameraTransform, sourceSpace: 'world', targetSpace: 'world' }),
      ],
    })

    const barWidth = 1.2
    const barHeight = 0.14
    const border = 0.04
    this.createEntity({
      parent: plate,
      transform: new TransformComponent(),
      components: [
        // without a texture a sprite is a tinted white quad
        new SpriteComponent({ width: barWidth + border * 2, height: barHeight + border * 2 }).setColor(0.1, 0.1, 0.1),
      ],
    })
    const fill = new SpriteComponent({ width: barWidth, height: barHeight, pivotX: 0 })
    this.createEntity({
      parent: plate,
      // starts at the left edge of the bar, slightly in front of the background
      transform: new TransformComponent({ position: vec3(-barWidth / 2, 0, 0.01) }),
      components: [fill],
    })
    this.createEntity({
      parent: plate,
      transform: new TransformComponent({ position: vec3(0, barHeight / 2 + border + 0.06, 0) }),
      components: [
        // the pivot is at the bottom center of the name
        new SpriteComponent({ pivotX: 0.5, pivotY: 1 })
          .setTexture(names, rect.x, rect.y, rect.width, rect.height)
          .setSizeFromSource(160),
      ],
    })

    const nameplate = new NameplateComponent(fill, barWidth)
    plate.addComponent(nameplate)
    this.plates.push(nameplate)

    const walk = new WalkComponent(body.getTransform<TransformComponent>()!, {
      radius: 2 + index * 1.3,
      speed: (index % 2 ? -1 : 1) * (0.45 - index * 0.05),
      phase: index * 1.3,
    })
    root.addComponent(walk)

    this.loadModel(`${ANIMALS}${model}.glb`).then((loaded) => {
      // every animal has its own instance, so it can be animated on its own
      const instance = loaded.instantiate()
      body.component(ModelComponent).model = instance
      walk.player = instance.createAnimationPlayer()
      walk.player?.play('walk', { loop: true })
    })
  }

  public hitAll() {
    for (const plate of this.plates) {
      plate.hit(0.3)
    }
  }

  protected override onUpdate(time: number, dt: number): void {
    this.camera.aspect = this.device.output.aspectRatio
    // the camera moves before the world update, so the plates copy its current rotation
    if (settings.orbit) {
      this.cameraAngle += dt * 0.12
    }
    const transform = this.camera.entity.getTransform<TransformComponent>()!
    transform.setPosition(Math.sin(this.cameraAngle) * 17, 10, Math.cos(this.cameraAngle) * 17)
    transform.lookAt(vec3(0, 0.5, 0), vec3(0, 1, 0))
    for (const plate of this.plates) {
      plate.entity.getTransform<TransformComponent>()!.setScaleUniform(settings.plateScale)
    }
  }
}

/**
 * Walks the entity on a circle, turns the body towards the walking direction and plays its walk animation
 */
class WalkComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public player: AnimationPlayer | null = null
  private angle: number

  public constructor(
    private body: TransformComponent,
    private path: { radius: number; speed: number; phase: number },
  ) {
    this.angle = path.phase
  }

  public updateBehavior(time: number, dt: number): void {
    const { radius, speed } = this.path
    this.angle += dt * speed
    this.entity
      .getTransform<TransformComponent>()!
      .setPosition(Math.cos(this.angle) * radius, 0, Math.sin(this.angle) * radius)
    // the models look along +z, turn them along the tangent of the circle
    this.body.setRotationAxisAngle(0, 1, 0, -this.angle + (speed > 0 ? 0 : Math.PI))
    this.player?.update(dt)
  }
}

/**
 * Simulates health and shows it in the health bar
 */
class NameplateComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public health = 1
  private nextHit = Math.random() * 3

  public constructor(
    private fill: SpriteComponent,
    private width: number,
  ) {}

  public hit(damage: number) {
    this.health = clamp(this.health - damage, 0, 1)
  }

  public updateBehavior(time: number, dt: number): void {
    this.nextHit -= dt
    if (this.nextHit <= 0) {
      this.nextHit = 1 + Math.random() * 3
      this.hit(0.1 + Math.random() * 0.25)
    }
    // regenerate, and respawn with full health
    this.health = this.health > 0 ? Math.min(1, this.health + dt * 0.04) : 1

    // the sprite is read every frame, changing its fields is all it takes
    const t = this.health
    this.fill.width = this.width * t
    this.fill.setColor(lerp(0.9, 0.3, t), lerp(0.2, 0.85, t), lerp(0.2, 0.3, t))
  }
}

interface NameRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Draws each name on a dark rounded background into one canvas and creates a texture from it
 */
function createNameAtlas(device: Device, names: string[]) {
  const rowHeight = 64
  const padding = 20
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = rowHeight * names.length
  const ctx = canvas.getContext('2d')!
  ctx.font = 'bold 36px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const rects = names.map((name, i) => {
    const width = Math.min(canvas.width, Math.ceil(ctx.measureText(name).width) + padding * 2)
    const rect: NameRect = { x: 0, y: i * rowHeight, width, height: rowHeight }
    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)'
    ctx.beginPath()
    ctx.roundRect(rect.x + 2, rect.y + 6, rect.width - 4, rect.height - 12, 14)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.fillText(name, rect.x + rect.width / 2, rect.y + rowHeight / 2 + 2)
    return rect
  })

  return { texture: device.createTexture({ source: canvas }), rects }
}
