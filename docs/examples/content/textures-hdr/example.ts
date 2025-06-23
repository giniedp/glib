import { ContentLoader } from '@gglib/content'
import { BlendState, createDevice, cubeGeometry, CullState, DepthState, Device } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { HDR } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const PANORAMA_IMAGES = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const files = PANORAMA_IMAGES

  TweakUi.mount(tools, (ui) => {
    loadTexture(files.Court)
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
        material.BaseColorMap = result
        material.ShadeFunction = 'shadeBlinn'
      })
      .catch((e) => {
        console.error(e)
      })
  }

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
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.blendState = BlendState.AlphaBlend
    device.clear(0xff2e2620, 1.0)

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.draw(geometry!)
  }

  return loop(frame).stop
}

function demoCamera() {
  const data =  {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    update: (mouse: Mouse, device: Device) => updateCamera(data, mouse, device)
  }
  return data
}

function updateCamera(camera: ReturnType<typeof demoCamera>, mouse: Mouse, device: Device) {
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
