import { ContentLoader } from '@gglib/content'
import { Color, CommonInputs, createDevice, FrameContext, PlatformId, sphereGeometry } from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  mat4$initOrthographicOffCenter,
  mat4$initPerspectiveFieldOfView,
  mat4$setTranslationY,
  mat4CreateLookAt,
  mat4GetTranslationX,
  mat4GetTranslationY,
  mat4Invert,
  vec3,
  vec3AddScalars,
} from '@gglib/math'
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
        world: mat4CreateLookAt(vec3(SIZE), center, vec3.UnitY),
      }),
    }),
    renderer.createView({
      viewport: { x: 0.5, y: 0.0, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: mat4CreateLookAt(vec3AddScalars(center, 0.0, 15, 0.1), center, vec3.UnitY),
      }),
    }),
    renderer.createView({
      viewport: { x: 0.0, y: 0.5, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: mat4CreateLookAt(vec3AddScalars(center, 0, 0, 15), center, vec3.UnitY),
      }),
    }),
    renderer.createView({
      viewport: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      camera: createCamera({
        world: mat4CreateLookAt(vec3AddScalars(center, 0, 0, -15), center, vec3.UnitY),
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

  function frame(ctx: FrameContext) {
    frameTime = ctx.delta
    device.resize()
    for (let i = 0; i < scene.views.length; i++) {
      const view = scene.views[i]
      mat4Invert(view.camera.world, view.camera.view)
      if (i == 0) {
        mat4$initPerspectiveFieldOfView(
          view.camera.projection,
          45 * DEGREE_TO_RAD,
          device.output.aspectRatio,
          view.camera.near,
          view.camera.far,
          device.ndcMinZ,
          view.camera.reversedZ,
        )
      } else {
        mat4$initOrthographicOffCenter(
          view.camera.projection,
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
      const x = mat4GetTranslationX(w) - SIZE / 2
      const z = mat4GetTranslationY(w) - SIZE / 2
      const r = Math.sqrt(x * x + z * z)
      const y = Math.sin(r - ctx.time) * 0.5
      mat4$setTranslationY(w, y)
    }

    renderer.update(ctx.time)
    renderer.render(scene)
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
