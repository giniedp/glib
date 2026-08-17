import { ContentLoader } from '@gglib/content'
import { TonemapOperator } from '@gglib/effects'
import { boxGeometry, CommonInputs, createDevice, PlatformId, sphereGeometry, TaskContext } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3, vec3 } from '@gglib/math'

import { BloomPass, GeometryPass, PixelatePass, Renderer, TonemapPass, VignettePass } from '@gglib/render'
import { mountUi } from 'tweak-ui'
import { createCamera, createObject, createScene } from './basics-scene'

const SIZE = 20
export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready

  const content = new ContentLoader(device)

  const pixelate = new PixelatePass(device, { enabled: false })
  const bloom = new BloomPass(device, { enabled: false })
  const tonemap = new TonemapPass(device, { enabled: false })

  const renderer = new Renderer(device, {
    pipeline: {
      passes: [new GeometryPass(), pixelate, bloom, tonemap],
    },
  })

  renderer.inputs.set(CommonInputs.Global.AmbientColor, vec3(0))
  renderer.inputs.set(CommonInputs.Global.AmbientColorTop, vec3(1))

  const scene = createScene()
  const camera = createCamera()
  camera.world.initLookAt(vec3(SIZE), vec3(SIZE / 2, 0, SIZE / 2), Vec3.UnitY)

  const textures = await Promise.all(
    [
      '/textures/prototype/light/texture_02.png',
      '/textures/prototype/red/texture_02.png',
      '/textures/prototype/green/texture_02.png',
      '/textures/prototype/orange/texture_02.png',
      '/textures/prototype/purple/texture_02.png',
    ].map((it) => content.loadTexture(it)),
  )

  const geometry = sphereGeometry(device)

  const view = renderer.createView({
    name: 'main',
    camera,
  })
  scene.views.push(view)

  for (let z = 0; z < SIZE; z++) {
    for (let x = 0; x < SIZE; x++) {
      const texture = textures[Math.max(x, z) % textures.length]
      const object = createObject(device, texture, geometry, vec3(x, 0, z))
      scene.items.push(object)
    }
  }

  function frame(ctx: TaskContext) {
    device.resize()

    Mat4.invert(view.camera.world, view.camera.view)
    view.camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      camera.near,
      camera.far,
      device.ndcMinZ,
      camera.reversedZ,
    )

    for (const item of scene.items) {
      const w = item.transform
      const x = w.translationX - SIZE / 2
      const z = w.translationZ - SIZE / 2
      const r = Math.sqrt(x * x + z * z)
      const y = Math.sin(r - ctx.time / 100) * 0.5
      w.setTranslationY(y)
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
      ui.scalar(bloom, 'threshold', { range: true, min: 0, max: 1 })
      ui.scalar(bloom, 'knee', { range: true, min: 0, max: 1 })
      ui.scalar(bloom, 'steps', { range: true, min: 1, max: 10, step: 1 })
      ui.scalar(bloom, 'intensity', { range: true, min: 0, max: 1 })
    })
    ui.group('Tonemap Pass', (ui) => {
      ui.bool(tonemap, 'enabled')
      ui.scalar(tonemap, 'exposure', { range: true, min: 0, max: 10 })
      ui.select(tonemap, 'operator', {
        options: TonemapOperator,
      })
    })
  })

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
