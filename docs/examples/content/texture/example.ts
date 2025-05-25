import { ContentLoader } from '@gglib/content'
import '@gglib/content-loaders'
import { createDevice, cubeGeometry } from '@gglib/graphics'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const content = new ContentLoader(device)

  const material = new AutoMaterial(device)
  const geometry = cubeGeometry(device)

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()

  content
    .loadTexture('/assets/textures/backgrounds/colored_castle.png')
    .then((result) => {
      material.DiffuseMap = result
    })
    .catch((e) => {
      console.error(e)
    })

  function render(time: number, dt: number) {
    device.resize()
    device.clear(0xff2e2620, 1.0)

    world.rotateY(dt * 0.0001)
    view.initTranslation(0, 0, 2.5).invert()
    projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.001, 100)

    material.World = world
    material.View = view
    material.Projection = projection
    material.draw(geometry)
  }

  return loop(render).stop
}
