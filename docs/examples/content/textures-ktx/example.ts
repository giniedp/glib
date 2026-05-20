import { ContentLoader } from '@gglib/content'
import {
  BasicMaterial,
  BlendState,
  Color,
  CullState,
  Device,
  PlatformId,
  Texture,
  createDevice,
  cubeGeometry,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { KTX } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import * as TweakUi from 'tweak-ui'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  content.registerLoader(KTX.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const files = {
    dust: '/textures/cubemaps/dust.ktx2',
    horsemounttraditionalb_diff:
      'https://cdn.nw-buddy.de/models/objects/characters/player/mounts/horsemounttraditional/textures/horsemounttraditionalb_diff.ktx2',
  }

  TweakUi.mount(tools, (ui) => {
    loadTexture(files.horsemounttraditionalb_diff)
    Object.entries(files).forEach(([name, url]) => {
      ui.button(name, { onClick: () => loadTexture(url) })
    })
  })

  const material = new BasicMaterial(device)
  const geometry = cubeGeometry(device)
  // const skyMaterial = new Material(device, {
  //   program: skyboxProgram(device),
  //   parameters: {},
  // })

  const world = Mat4.createScaleUniform(10)
  const camera = demoCamera()

  function loadTexture(url: string) {
    content
      .loadTexture(url)
      .then((result) => {
        // material.Texture = result
        // material.TextureEnabled = true
      })
      .catch((e) => {
        console.error(e)
      })
  }

  const pass = device.renderPass
  function frame() {
    device.resize()
    updateCamera(mouse, camera, device)

    pass.flush()
    pass.setCullState(CullState.CullBack)
    pass.setRenderBlend(0, BlendState.AlphaBlend)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    world.setTranslation(camera.position)
    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.draw(pass, geometry!)
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
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

  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.UnitY).invert()
  camera.projection.initPerspectiveFieldOfView(
    45 * DEGREE_TO_RAD,
    device.output.aspectRatio,
    0.01,
    1000,
    device.ndcMinZ,
  )
}
