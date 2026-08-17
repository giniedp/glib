import { ContentLoader } from '@gglib/content'
import {
  boxGeometry,
  Color,
  CommonBlocks,
  CommonInputs,
  createDevice,
  cylinderGeometry,
  PlatformId,
  sphereGeometry,
  TaskContext,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, MT19937, vec3, Vec3 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { mountUi } from 'tweak-ui'
import { createCamera, createObject, createScene } from './basics-scene'

const SIZE = 20
export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready

  let frameTime = 0
  mountUi(tools, (ui) => {
    ui.graph({
      rows: [
        {
          sample: () => frameTime,
        },
      ],
    })
  })

  const content = new ContentLoader(device)
  const renderer = new Renderer(device)
  renderer.inputs.set(CommonInputs.Global.AmbientColor, Color.Black)

  const scene = createScene()
  const center = vec3(SIZE / 2, 0, SIZE / 2)
  scene.views = [
    renderer.createView({
      viewport: { x: 0.0, y: 0.0, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: Mat4.createLookAt(vec3(SIZE), center, Vec3.UnitY),
      }),
    }),
    renderer.createView({
      viewport: { x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: Mat4.createLookAt(Vec3.addXYZ(center, 0.0, 15, 0.1), center, Vec3.UnitY),
      }),
    }),
    renderer.createView({
      viewport: { x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: Mat4.createLookAt(Vec3.addXYZ(center, 0, 0, 15), center, Vec3.UnitY),
      }),
    }),
    renderer.createView({
      viewport: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: Mat4.createLookAt(Vec3.addXYZ(center, 0, 0, -15), center, Vec3.UnitY),
      }),
    }),
  ]

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

  for (let z = 0; z < SIZE; z++) {
    for (let x = 0; x < SIZE; x++) {
      const texture = textures[Math.max(x, z) % textures.length]
      const object = createObject(device, texture, geometry, vec3(x, 0, z))
      scene.items.push(object)
    }
  }

  function frame(ctx: TaskContext) {
    frameTime = ctx.dt
    device.resize()
    for (let i = 0; i < scene.views.length; i++) {
      const view = scene.views[i]
      Mat4.invert(view.camera.world, view.camera.view)
      if (i == 0) {
        view.camera.projection.initPerspectiveFieldOfView(
          45 * DEGREE_TO_RAD,
          device.output.aspectRatio,
          view.camera.near,
          view.camera.far,
          device.ndcMinZ,
          view.camera.reversedZ,
        )
      } else {
        view.camera.projection.initOrthographicOffCenter(
          -SIZE * device.output.aspectRatio * 0.25,
          SIZE * device.output.aspectRatio * 0.25,
          -SIZE * 0.25,
          SIZE * 0.25,
          view.camera.near,
          view.camera.far,
          device.ndcMinZ,
          view.camera.reversedZ,
        )
      }
    }

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

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
