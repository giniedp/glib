import { ContentLoader } from '@gglib/content'
import {
  BlendState,
  CullState,
  DepthState,
  Device,
  Material,
  Texture,
  createDevice,
  cubeGeometry,
  skyboxProgram,
} from '@gglib/graphics'
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
    dust: '/textures/cubemaps/dust.ktx2',
    horsemounttraditionalb_diff: 'https://cdn.nw-buddy.de/models/objects/characters/player/mounts/horsemounttraditional/textures/horsemounttraditionalb_diff.ktx2'
  }

  TweakUi.mount(tools, (ui) => {
    loadTexture(files.horsemounttraditionalb_diff)
    Object.entries(files).forEach(([name, url]) => {
      ui.button(name, { onClick: () => loadTexture(url) })
    })
  })

  let texture: Texture
  const material = new AutoMaterial(device)
  const geometry = cubeGeometry(device)
  const skyMaterial = new Material(device, {
    program: skyboxProgram(device),
    parameters: {},
  })

  const world = Mat4.createScaleUniform(10)
  const camera = demoCamera()

  function loadTexture(url: string) {
    content
      .loadTexture(url)
      .then((result) => {
        texture = result
        material.BaseColorMap = result
        material.ShadeFunction = 'shadeNone'
        skyMaterial.parameters.Texture = result
      })
      .catch((e) => {
        console.error(e)
      })
  }

  function frame(time: number, dt: number) {
    device.resize()
    updateCamera(mouse, camera, device)

    device.cullState = CullState.CullNone
    device.depthState = DepthState.Default
    device.blendState = BlendState.None
    device.clear(0xff2e2620, 1.0)

    world.setTranslation(camera.position)
    if (texture?.isCube) {
      skyMaterial.parameters.World = world
      skyMaterial.parameters.View = camera.view
      skyMaterial.parameters.Projection = camera.projection
      skyMaterial.draw(geometry!)
    } else {
      material.parameters.World = world
      material.parameters.View = camera.view
      material.parameters.Projection = camera.projection
      material.draw(geometry!)
    }
  }

  return loop(frame).stop
}

function demoCamera() {
  return {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }
}

function updateCamera(mouse: Mouse, camera: ReturnType<typeof demoCamera>, device: Device) {
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
