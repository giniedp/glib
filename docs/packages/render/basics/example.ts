import { TonemapOperator } from '@gglib/effects'
import {
  CommonMaterial,
  boxGeometry,
  createDevice,
  Device,
  Mesh,
  PlatformId,
  TaskContext,
  Texture,
  TRUE,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, MT19937, Random, vec3, Vec3 } from '@gglib/math'

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
  TonemapPass,
  VignettePass,
} from '@gglib/render'
import { mountUi } from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const renderer = new Renderer(device)
  const pixelate = new PixelatePass(device, { enabled: false })
  const bloom = new BloomPass(device, { enabled: false })
  const vignette = new VignettePass(device, { enabled: false })
  const tonemap = new TonemapPass(device, { enabled: false })
  const rnd = new MT19937(0x9abcdef0)
  renderer.pipeline.passes.push(pixelate)
  renderer.pipeline.passes.push(bloom)
  renderer.pipeline.passes.push(tonemap)
  renderer.pipeline.passes.push(vignette)

  const scene = createScene()
  const camera: CameraData = {
    visibilityMask: LayerMask.All,
    world: Mat4.createIdentity().translateXYZ(5, 5, 15),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    reversedZ: false,
    near: 0.1,
    far: 100,
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

  const view = renderer.createView({
    name: 'main',
    camera,
  })
  scene.views.push(view)

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
      ui.bool(pixelate, 'enabled')
      ui.scalar(pixelate, 'size', { range: true, min: 1, max: 50, step: 1 })
      ui.scalar(pixelate, 'aspect', { range: true, min: 0.001, max: 2, step: 0.001 })
      ui.scalar(pixelate, 'corner', { range: true, min: 0, max: 1 })
      ui.scalar(pixelate, 'dither', { range: true, min: 0, max: 1 })
      ui.scalar(pixelate, 'gap', { range: true, min: 0, max: 1 })
    })
    ui.group('Bloom Pass', (ui) => {
      ui.bool(bloom, 'enabled')
      ui.scalar(bloom, 'gaussSigma', { range: true, min: 0.1, max: 10 })
      ui.scalar(bloom, 'glowCut', { range: true, min: 0, max: 1 })
      ui.scalar(bloom, 'multiplier', { range: true, min: 0, max: 1 })
      ui.scalar(bloom, 'iterations', { range: true, min: 1, max: 10, step: 1 })
      ui.scalar(bloom, 'resolutionScale', { range: true, min: 0.1, max: 1 })
    })
    ui.group('Tonemap Pass', (ui) => {
      ui.bool(tonemap, 'enabled')
      ui.bool(tonemap, 'autoExposure')
      ui.scalar(tonemap, 'adaptSpeed', { range: true, min: 0, max: 1 })
      ui.scalar(tonemap, 'whitePoint', { range: true, min: 0, max: 1 })
      ui.scalar(tonemap, 'exposure', { range: true, min: 0, max: 10 })
      ui.select(tonemap, 'operator', {
        options: TonemapOperator,
      })
    })
    ui.group('Vignette Pass', (ui) => {
      ui.bool(vignette, 'enabled')
      ui.scalar(vignette, 'centerX', { range: true, min: 0, max: 1, step: 0.001 })
      ui.scalar(vignette, 'centerY', { range: true, min: 0, max: 1, step: 0.001 })
      ui.scalar(vignette, 'radiusX', { range: true, min: 0, max: 1, step: 0.001 })
      ui.scalar(vignette, 'radiusY', { range: true, min: 0, max: 1, step: 0.001 })
      ui.scalar(vignette, 'inner', { range: true, min: 0, max: 1 })
      ui.scalar(vignette, 'strength', { range: true, min: 0, max: 1 })
      ui.scalar(vignette, 'power', { range: true, min: 1, max: 10 })
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
  const material = new CommonMaterial(device)
  const random = Vec3.create(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat())
  const world = Mat4.createTranslationXYZ(random.x * max, random.y * max, random.z * max)
  const seed = Vec3.create(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat())

  const texture = textures[0]
  material.Texture = texture
  material.TextureEnabled = TRUE
  material.LightingEnabled = TRUE
  material.BaseColor = vec3([random.x, random.y, random.z])
  material.setDirectionalLight(0, Vec3.create(1, 1, 1), Vec3.create(0, 0, -1))

  return {
    type: RenderItemType.Mesh,
    layer: LayerMask.All,
    flags: RenderItemFlags.Opaque,
    transform: world,
    data: new Mesh(device, {
      materials: [material],
      geometries: [boxGeometry(device, {})],
      parts: [
        {
          geometryIndex: 0,
          materialIndex: 0,
        },
      ],
    }),
    update: () => {
      world.rotateYawPitchRoll(seed.x * 0.01, seed.y * 0.01, seed.z * 0.01)
      material.World = world
    },
  }
}

interface Scene extends RenderScene {
  items: Updatable[]
}
function createScene(): Scene {
  const scene: Scene = {
    items: [],
    views: [],
    output: null,
    collect: (frame, camera, out) => {
      for (const item of scene.items) {
        out.push(item)
      }
    },
  }
  return scene
}
