import { ContentLoader } from '@gglib/content'
import { createDevice, cubeGeometry } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const content = new ContentLoader(device)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true
  })

  const material = new AutoMaterial(device)
  const geometry = cubeGeometry(device)

  const world = Mat4.createIdentity()
  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  content
    .loadTexture('/textures/backgrounds/colored_castle.png')
    .then((result) => {
      material.DiffuseMap = result
    })
    .catch((e) => {
      console.error(e)
    })

  function updateCamera() {
    mouse.update()
    if (mouse.leftButtonIsPressed) {
      camera.theta -= mouse.dx * 0.1
      camera.phi -= mouse.dy * 0.1
    }
    if (mouse.middleButtonIsPressed) {
      camera.distance += mouse.dy * 0.01
      camera.distance = Math.max(0.1, camera.distance)
    }

    // prettier-ignore
    camera.position.initSpherical(
      camera.phi * DEGREE_TO_RAD,
      camera.theta * DEGREE_TO_RAD,
      camera.distance,
    )
    camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.Up).invert()
    camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
  }
  function frame(time: number, dt: number) {
    updateCamera()
    device.resize()
    device.clear(0xff2e2620, 1.0)

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.draw(geometry)
  }

  return loop(frame).stop
}
