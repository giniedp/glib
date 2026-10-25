import {
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  LightComponent,
  ModelComponent,
  MouseInputSystem,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { CommonMaterial, IblSampler, skyboxMaterial, TonemapOperator } from '@gglib/effects'
import { KeyboardKeys, MouseListener } from '@gglib/game'
import { boxGeometry, PlatformId, TRUE } from '@gglib/graphics'
import { HDR } from '@gglib/loaders'
import {
  IVec3,
  IVec4,
  mat3CreateIdentity,
  mat4$initScaleXYZ,
  mat4Identity,
  quatCreateAxisAngle,
  vec3,
  vec3Add,
  vec3MultiplyScalar,
  vec4,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { opaquePassMSAA, Renderer, TonemapPass, transparentPassMSAA } from '@gglib/render'
import Ammo from 'ammojs-typed'
import { mount } from 'tweak-ui'
import { ShapeComponent } from './game-object'
import { HingeJoint, PointJoint } from './physics-constraints'
import { PhysicsProxy, PhysicsShape } from './physics-proxy'
import { PhysicsWorld } from './physics-world'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  await Ammo.call({}, Ammo)
  const game = new Game({ canvas, platform, autosize: true })
  await game.run()

  const panel = mount(tools, (ui) => {
    ui.button('Reset', { onClick: () => game.resetScene() })
    ui.button('Wrecking ball', { onClick: () => game.raiseWreckingBall() })
  })

  return () => {
    game.destroy()
    panel.dispose()
  }
}

const NO_ROTATION = vec4(0, 0, 0, 1)
const QUARTER_TURN = quatCreateAxisAngle(vec3(0, 1, 0), Math.PI / 2)

const BALL_COUNT = 30
const BALL_SPEED = 40

// the chain hangs next to the tower, the wrecking ball at its end
const CHAIN_ANCHOR = vec3(6, 13, 0)
const CHAIN_LINKS = 6
const LINK_LENGTH = 1.2

/**
 * A body and where it starts after a reset
 */
interface Placement {
  proxy: PhysicsProxy
  position: IVec3
  rotation: IVec4
}

class Game extends EcsGame {
  private keyboard!: KeyboardInputSystem
  private mouse!: MouseInputSystem
  private camera!: CameraComponent
  private ibl!: IblSampler

  private placements: Placement[] = []
  private chain: PhysicsProxy[] = []
  private balls: PhysicsProxy[] = []
  private nextBall = 0
  private clickX = 0
  private clickY = 0

  private palette!: {
    ground: CommonMaterial
    wall: CommonMaterial
    ball: CommonMaterial
    wood: CommonMaterial
    colors: CommonMaterial[]
  }

  public override onCreate(): void {
    const canvas = this.device.canvas as HTMLCanvasElement
    this.keyboard = new KeyboardInputSystem()
    this.mouse = new MouseInputSystem({ provider: new MouseListener({ eventTarget: canvas, captureTarget: canvas }) })
    this.world.addSystem(this.keyboard)
    this.world.addSystem(this.mouse)
    this.world.addSystem(new PhysicsWorld())
    // the materials render in linear HDR, the tonemap pass maps the result to the screen
    this.world.addSystem(
      new Renderer(this.device, {
        linearToSrgb: false,
        pipeline: {
          passes: [
            opaquePassMSAA(),
            transparentPassMSAA(),
            new TonemapPass(this.device, { enabled: true, operator: TonemapOperator.PBR_NEUTRAL, srgb: true }),
          ],
        },
      }),
    )
  }

  protected override async onLoadContent() {
    this.content.registerLoader(HDR.Loader)

    // filters the panorama into the maps for image based lighting
    this.ibl = new IblSampler(this.device, {})
    await this.ibl.compiled
    this.ibl.update(await this.content.loadTexture('/textures/hdr/footprint_court.hdr'))

    const inputs = this.world.getSystem(Renderer).inputs
    inputs.createBlock('ibl')
    inputs.setByBlockAndName('ibl', 'intensity', 1)
    inputs.setByBlockAndName('ibl', 'rotation', mat3CreateIdentity())
    inputs.setByBlockAndName('ibl', 'brdfMap', this.ibl.lutMapGGX)
    inputs.setByBlockAndName('ibl', 'radianceMap', this.ibl.envMapGGX)
    inputs.setByBlockAndName('ibl', 'irradianceMap', this.ibl.envMapLambert!)
    inputs.setByBlockAndName('ibl', 'mipCount', this.ibl.envMapGGX.mipLevelCount)

    this.createSkybox()
    await this.createMaterials()
    this.createCamera()
    this.createLight()
    this.createArena()
    this.createTower(vec3(0, 0.5, 0))
    this.createPyramid(vec3(-9, 0.5, -3))
    this.createDoor(vec3(6, 0.5, 6))
    this.createChain()
    this.createLooseShapes(16)
    this.resetScene()
  }

  private createSkybox() {
    this.createEntity({
      name: 'Sky',
      parent: this.scene.entity,
      components: [
        new ModelComponent({
          model: new Model(this.device, {
            meshes: [
              {
                geometries: [boxGeometry(this.device, { name: 'Skybox', invert: true })],
                materials: [skyboxMaterial(this.device, { cubemap: this.ibl.envMapGGX, blur: 0.3, intensity: 1 })],
                parts: [{ geometryIndex: 0, materialIndex: 0 }],
              },
            ],
          }),
        }),
      ],
    })
  }

  private async createMaterials() {
    const material = (roughness: number, metallic = 0) => {
      const result = new CommonMaterial(this.device, { properties: {} })
      result.Roughness = roughness
      result.Metallic = metallic
      result.UseIBL = TRUE
      result.UseLights = TRUE
      return result
    }
    /**
     * A prototype grid texture, repeated `tiles` times on each face
     */
    const prototype = async (color: string, texture: string, tiles = 1, roughness = 0.6) => {
      const result = material(roughness)
      result.BaseMap = await this.content.loadTexture(`/textures/prototype/${color}/texture_${texture}.png`, {
        color: 'srgb',
      })
      result.UseBaseMap = TRUE
      if (tiles !== 1) {
        result.TextureMod = mat4$initScaleXYZ(mat4Identity(), tiles, tiles, 1)
        result.UseTextureMod = TRUE
      }
      return result
    }
    const chrome = material(0.15, 1)
    chrome.BaseColor = vec3(0.9, 0.9, 0.92)

    const [ground, wall, wood, ...colors] = await Promise.all([
      prototype('dark', '01', 25, 0.9),
      prototype('light', '01', 10, 0.8),
      prototype('orange', '08', 1, 0.7),
      prototype('red', '02', 1, 0.5),
      prototype('orange', '02', 1, 0.4),
      prototype('green', '02', 1, 0.6),
      prototype('purple', '02', 1, 0.3),
      prototype('light', '02', 1, 0.3),
      prototype('dark', '02', 1, 0.5),
    ])
    this.palette = { ground, wall, ball: chrome, wood, colors }
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'Camera',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(1, 7, 16) }),
      components: [new CameraComponent({ type: 'perspective', far: 500 }), new WASDComponent()],
    })
    // look down at the tower
    entity.component(WASDComponent).targetVertical = -0.25
    this.camera = entity.component(CameraComponent)
    this.scene.setCamera(0, this.camera)
  }

  private createLight() {
    this.createEntity({
      name: 'Sun',
      parent: this.scene.entity,
      transform: new TransformComponent({ rotation: quatCreateAxisAngle(vec3(1, 0.3, 0), -1) }),
      components: [new LightComponent()],
    })
  }

  /**
   * Creates an entity with a physics body and a model of the same shape
   */
  private createBody(
    name: string,
    shape: PhysicsShape,
    size: IVec3,
    material: CommonMaterial,
    mass: number,
    ...components: any[]
  ): PhysicsProxy {
    const proxy = new PhysicsProxy({ shape, size, mass, dynamic: mass > 0, ccd: shape === PhysicsShape.Sphere })
    this.createEntity({
      name,
      parent: this.scene.entity,
      components: [new ModelComponent(), proxy, new ShapeComponent(material), ...components],
    })
    return proxy
  }

  /**
   * Creates a body that returns to the given position on reset
   */
  private place(proxy: PhysicsProxy, position: IVec3, rotation: IVec4 = NO_ROTATION) {
    this.placements.push({ proxy, position, rotation })
    return proxy
  }

  private createArena() {
    const { ground, wall } = this.palette
    this.place(this.createBody('Ground', PhysicsShape.Box, vec3(100, 1, 100), ground, 0), vec3(0, 0, 0))
    for (const [x, z, w, d] of [
      [0, -50, 100, 2],
      [0, 50, 100, 2],
      [-50, 0, 2, 100],
      [50, 0, 2, 100],
    ]) {
      this.place(this.createBody('Wall', PhysicsShape.Box, vec3(w, 2, d), wall, 0), vec3(x, 1, z))
    }
  }

  /**
   * Layers of three bricks, each layer turned by 90 degrees
   */
  private createTower(base: IVec3) {
    const layers = 12
    const height = 0.8
    for (let layer = 0; layer < layers; layer++) {
      const turned = layer % 2 === 1
      for (let i = -1; i <= 1; i++) {
        const material = this.palette.colors[(layer + i + 1) % this.palette.colors.length]
        const brick = this.createBody('Brick', PhysicsShape.Box, vec3(3, height, 1), material, 1)
        const y = base.y + height / 2 + layer * height
        this.place(
          brick,
          turned ? vec3(base.x + i, y, base.z) : vec3(base.x, y, base.z + i),
          turned ? QUARTER_TURN : NO_ROTATION,
        )
      }
    }
  }

  /**
   * Rows of cylinders, each row on top of the gaps of the row below, cones on top
   */
  private createPyramid(base: IVec3) {
    const rows = 5
    const size = vec3(1, 1.2, 1)
    for (let row = 0; row < rows; row++) {
      const count = rows - row
      for (let i = 0; i < count; i++) {
        const top = row === rows - 1
        const proxy = top
          ? this.createBody('Cone', PhysicsShape.Cone, vec3(0.5, 1.2, 0.5), this.palette.colors[1], 0.5)
          : this.createBody('Barrel', PhysicsShape.Cylinder, size, this.palette.colors[row % 3], 1)
        this.place(proxy, vec3(base.x + (i - (count - 1) / 2) * 1.05, base.y + 0.6 + row * 1.2, base.z))
      }
    }
  }

  /**
   * A door on a static post, connected with a hinge that swings up to 90 degrees each way
   */
  private createDoor(base: IVec3) {
    const post = this.createBody('Post', PhysicsShape.Box, vec3(0.4, 6, 0.4), this.palette.wall, 0)
    this.place(post, vec3(base.x, base.y + 3, base.z))

    const width = 4
    const door = this.createBody(
      'Door',
      PhysicsShape.Box,
      vec3(width, 5.5, 0.3),
      this.palette.wood,
      3,
      new HingeJoint(post, {
        // the left edge of the door turns around the right side of the post
        pivot: vec3(-width / 2 - 0.1, 0, 0),
        otherPivot: vec3(0.3, 0, 0),
        axis: vec3(0, 1, 0),
        limit: Math.PI / 2,
      }),
    )
    // same height as the post, so the hinge pivots match
    this.place(door, vec3(base.x + 0.3 + width / 2 + 0.1, base.y + 3, base.z))
  }

  /**
   * Links that hang from a static anchor, each linked to the one above, with a heavy ball at the end
   */
  private createChain() {
    const anchor = this.createBody('Anchor', PhysicsShape.Sphere, vec3(0.3), this.palette.wall, 0)
    this.place(anchor, CHAIN_ANCHOR)

    const half = LINK_LENGTH / 2
    let above = anchor
    for (let i = 0; i < CHAIN_LINKS; i++) {
      const last = i === CHAIN_LINKS - 1
      const radius = last ? 1.2 : 0.3
      const link = this.createBody(
        last ? 'Wrecking ball' : 'Link',
        PhysicsShape.Sphere,
        vec3(radius),
        last ? this.palette.ball : this.palette.colors[4],
        last ? 30 : 0.5,
        new PointJoint(above, {
          // the top of this link hangs at the bottom of the one above
          pivot: vec3(0, last ? radius : half, 0),
          otherPivot: vec3(0, above === anchor ? 0 : -half, 0),
        }),
      )
      this.chain.push(link)
      above = link
    }
    this.hangChain(false)
  }

  /**
   * Places the chain links straight down, or sideways so the ball swings down into the tower
   */
  private hangChain(raised: boolean) {
    // the distance of each link center from the anchor, along the chain
    let offset = -LINK_LENGTH / 2
    this.chain.forEach((link, i) => {
      const last = i === this.chain.length - 1
      offset += last ? LINK_LENGTH / 2 + link.size.x : LINK_LENGTH
      const position = raised
        ? vec3(CHAIN_ANCHOR.x + offset, CHAIN_ANCHOR.y, CHAIN_ANCHOR.z)
        : vec3(CHAIN_ANCHOR.x, CHAIN_ANCHOR.y - offset, CHAIN_ANCHOR.z)
      link.setTransform(position, NO_ROTATION)
    })
  }

  private createLooseShapes(count: number) {
    const shapes = [
      { shape: PhysicsShape.Box, size: vec3(1.2) },
      { shape: PhysicsShape.Sphere, size: vec3(0.6) },
      { shape: PhysicsShape.Cylinder, size: vec3(1, 1.5, 1) },
      { shape: PhysicsShape.Cone, size: vec3(0.6, 1.4, 0.6) },
    ]
    for (let i = 0; i < count; i++) {
      const { shape, size } = shapes[i % shapes.length]
      const material = this.palette.colors[i % this.palette.colors.length]
      const proxy = this.createBody('Shape', shape, size, material, 1)
      this.place(proxy, vec3(8 + (i % 4) * 2.5, 12 + Math.floor(i / 4) * 3, -8 + (i % 3) * 2))
    }
  }

  public resetScene() {
    for (const it of this.placements) {
      it.proxy.setTransform(it.position, it.rotation)
    }
    this.hangChain(false)
  }

  /**
   * Lifts the chain away from the tower, it swings down into it
   */
  public raiseWreckingBall() {
    this.hangChain(true)
  }

  /**
   * Fires a ball from the camera along the given ray. The oldest ball is reused once all are in use
   */
  private shoot(xNormalized: number, yNormalized: number) {
    const ray = this.camera.createRay(xNormalized, yNormalized)
    if (this.balls.length < BALL_COUNT) {
      this.balls.push(this.createBody('Ball', PhysicsShape.Sphere, vec3(0.5), this.palette.ball, 5))
    }
    const ball = this.balls[this.nextBall++ % BALL_COUNT]
    // starts a bit in front of the camera, so it does not hit the camera near plane
    const start = vec3Add(ray.position, ray.direction)
    ball.launch(start, NO_ROTATION, vec3MultiplyScalar(ray.direction, BALL_SPEED))
  }

  public override onUpdate() {
    this.camera.aspect = this.device.output.aspectRatio

    if (this.keyboard.justPressed(KeyboardKeys.Enter)) {
      this.resetScene()
    }
    if (this.keyboard.justPressed(KeyboardKeys.Space)) {
      this.shoot(0.5, 0.5)
    }
    // dragging with the left button turns the camera, a click without moving the mouse shoots
    const mouse = this.mouse
    if (mouse.leftButtonJustPressed) {
      this.clickX = mouse.xNormalized
      this.clickY = mouse.yNormalized
    }
    if (mouse.leftButtonJustReleased) {
      const moved = Math.hypot(mouse.xNormalized - this.clickX, mouse.yNormalized - this.clickY)
      if (moved < 0.01) {
        this.shoot(mouse.xNormalized, mouse.yNormalized)
      }
    }
  }
}
