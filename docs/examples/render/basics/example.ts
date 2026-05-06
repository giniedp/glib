import {
  BasicMaterial,
  createDevice,
  cubeGeometry,
  Device,
  Mesh,
  PlatformId,
  TaskContext,
  Texture,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, MT19937, Vec3 } from '@gglib/math'
import { Random } from '@gglib/math/dist/math/src/random/types'
import {
  BloomPass,
  CameraData,
  LayerMask,
  MeshRenderItem,
  PixelatePass,
  Renderer,
  RenderItem,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
  VignettePass,
} from '@gglib/render'
import { mountUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const renderer = new Renderer(device)
  const pixelate = new PixelatePass(device, { enabled: false })
  const bloom = new BloomPass(device, { enabled: false })
  const vignette = new VignettePass(device, { enabled: false })
  const rnd = new MT19937(0x9abcdef0)
  renderer.pipeline.addPass(pixelate)
  renderer.pipeline.addPass(bloom)
  renderer.pipeline.addPass(vignette)

  const scene = createScene()
  const camera: CameraData = {
    visibilityMask: LayerMask.All,
    world: Mat4.createIdentity().translateXYZ(5, 5, 15),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    reversedZ: false,
  }

  const textures = [
    device.createTexture({
      source: '/textures/prototype/light/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/red/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/green/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/orange/texture_02.png',
    }),
    device.createTexture({
      source: '/textures/prototype/purple/texture_02.png',
    }),
  ]

  const view = renderer.addView({
    name: 'main',
    camera,
  })

  for (let i = 0; i < 100; i++) {
    scene.items.push(createObject(device, textures, rnd))
  }

  function frame(ctx: TaskContext) {
    device.resize()
    Mat4.invert(view.camera.world, view.camera.view)

    view.camera.reversedZ = false
    view.camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.1,
      15,
      device.ndcMinZ,
      false,
    )
    for (const item of scene.items) {
      item.update()
    }

    renderer.update(ctx.time)
    renderer.render(scene)
  }

  mountUi(tools, (ui) => {
    ui.group('Pixelate Pass', (ui) => {
      ui.boolean(pixelate, 'enabled')
      ui.number(pixelate, 'size', { slider: true, min: 1, max: 50, step: 1 })
      ui.number(pixelate, 'aspect', { slider: true, min: 0.001, max: 2, step: 0.001 })
      ui.number(pixelate, 'corner', { slider: true, min: 0, max: 1 })
      ui.number(pixelate, 'dither', { slider: true, min: 0, max: 1 })
      ui.number(pixelate, 'gap', { slider: true, min: 0, max: 1 })
    })
    ui.group('Bloom Pass', (ui) => {
      ui.boolean(bloom, 'enabled')
      ui.number(bloom, 'gaussSigma', { slider: true, min: 0.1, max: 10 })
      ui.number(bloom, 'glowCut', { slider: true, min: 0, max: 1 })
      ui.number(bloom, 'multiplier', { slider: true, min: 0, max: 1 })
      ui.number(bloom, 'iterations', { slider: true, min: 1, max: 10, step: 1 })
      ui.number(bloom, 'resolutionScale', { slider: true, min: 0.1, max: 1 })
    })
    ui.group('Vignette Pass', (ui) => {
      ui.boolean(vignette, 'enabled')
      ui.number(vignette, 'centerX', { slider: true, min: 0, max: 1, step: 0.001 })
      ui.number(vignette, 'centerY', { slider: true, min: 0, max: 1, step: 0.001 })
      ui.number(vignette, 'radiusX', { slider: true, min: 0, max: 1, step: 0.001 })
      ui.number(vignette, 'radiusY', { slider: true, min: 0, max: 1, step: 0.001 })
      ui.number(vignette, 'inner', { slider: true, min: 0, max: 1 })
      ui.number(vignette, 'strength', { slider: true, min: 0, max: 1 })
      ui.number(vignette, 'power', { slider: true, min: 1, max: 10 })
      ui.color(vignette, 'color', { format: '[n]rgb' })
    })
  })

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

interface Updatable extends RenderItem {
  update: () => void
}

function createObject(device: Device, textures: Texture[], rnd: Random): MeshRenderItem & Updatable {
  const max = 10
  const material = new BasicMaterial(device)
  const random = Vec3.create(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat())
  const world = Mat4.createTranslationXYZ(random.x * max, random.y * max, random.z * max)
  const seed = Vec3.create(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat())

  const texture = textures[0]
  material.Texture = texture
  material.TextureEnabled = true
  material.LightingEnabled = true
  material.BaseColor.init(random.x, random.y, random.z)
  material.setDirectionalLight(0, Vec3.create(1, 1, 1), Vec3.create(0, 0, -1))

  return {
    type: RenderItemType.Mesh,
    layer: LayerMask.All,
    flags: RenderItemFlags.Opaque,
    transform: world,
    mesh: new Mesh(device, {
      materials: [material],
      parts: [cubeGeometry(device, { materialId: 0 })],
    }),
    update: () => {
      world.rotateYawPitchRoll(seed.x * 0.01, seed.y * 0.01, seed.z * 0.01)
      material.World.initFrom(world)
    },
  }
}

interface Scene extends RenderScene {
  items: Updatable[]
}
function createScene(): Scene {
  const scene: Scene = {
    items: [],
    collect: (camera, out) => {
      for (const item of scene.items) {
        out.push(item)
      }
    },
  }
  return scene
}
