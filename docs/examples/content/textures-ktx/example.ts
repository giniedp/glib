import { ContentLoader } from '@gglib/content'
import { BlendState, CullState, DepthState, createDevice, cubeGeometry } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { KTX } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const content = new ContentLoader(device)
  content.registerLoader(KTX.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const files = {
    dust: '/assets/textures/cubemaps/dust.ktx2',
  }

  TweakUi.mount(tools, (ui) => {
    loadTexture(files.dust)
    Object.entries(files).forEach(([name, url]) => {
      ui.button(name, { onClick: () => loadTexture(url) })
    })
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

  function loadTexture(url: string) {
    content
      .loadTexture(url)
      .then((result) => {
        material.DiffuseMap = result
        material.ShadeFunction = 'shadeNone'
      })
      .catch((e) => {
        console.error(e)
      })
  }

  function updateCamera() {
    mouse.update()
    if (mouse.leftButtonIsPressed) {
      camera.theta -= mouse.dxNormalized * 360
      camera.phi -= mouse.dyNormalized * 180
    }
    if (mouse.middleButtonIsPressed) {
      camera.distance += mouse.dyNormalized * 2
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
  function onFrame(time: number, dt: number) {
    device.resize()
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.blendState = BlendState.None
    device.clear(0xff2e2620, 1.0)

    updateCamera()
    world.rotateY(dt / 1000 * 5 * DEGREE_TO_RAD)

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.draw(geometry!)
  }

  return loop(onFrame).stop
}
