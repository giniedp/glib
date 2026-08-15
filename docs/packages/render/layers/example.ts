import { Color, createDevice, cubeGeometry } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4 } from '@gglib/math'
import { DrawableInfo, Renderer, Scene } from '@gglib/render'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const renderer = new Renderer(device)
  const scene = new Scene()
  scene.items = []
  scene.lights = [
    LightParams.createDirectionalLight({
      direction: [-1, -1, -1],
      color: [1, 1, 1],
    }),
  ]
  scene.camera = {
    world: Mat4.createIdentity(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    layerMask: 0xffffffff,
  }

  const material = new AutoMaterial(device)
  material.BaseColor = Color.White.xyzw
  const geometry = cubeGeometry(device, { size: 1 })
  const w = 16
  const h = 9
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      scene.items.push({
        order: 0,
        layer: Math.ceil(Math.random() * 7),
        type: 'drawable',
        item: geometry,
        material,
        transform: Mat4.createTranslation((i / (w - 1) - 0.5) * 1.5 * w, (j / (h - 1) - 0.5) * 1.5 * h, 0),
      } satisfies DrawableInfo)
    }
  }

  let t = 0
  function frame(time: number, dt: number) {
    const camera = scene.camera!

    t += dt
    if (t > 1000) {
      t = 0
      camera.layerMask = Math.ceil(Math.random() * 7)
    }

    camera.world.initTranslation(0, 0, 10 + Math.sin(time / 1000))
    camera.view.initFrom(camera.world).invert()
    camera.projection.initPerspectiveFieldOfView(70 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.1, 1500)
    renderer.render([scene])
  }

  return loop(frame).stop
}
