import { ContentLoader } from '@gglib/content'
import { BasicMaterial, Color, Device, PlatformId, Texture, createDevice, cubeGeometry } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { DDS } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const files = {
  bobcat_diff: '/textures/dds/bobcat_diff.dds',
  bobcat_ddna: '/textures/dds/bobcat_ddna.dds',
  bobcat_ddnaa: '/textures/dds/bobcat_ddna.a.dds',
}
const params = {
  texture: files.bobcat_diff,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  content.registerLoader(DDS.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  mountUi(tools, (ui) => {
    loadTexture(params.texture)
    ui.select(params, 'texture', {
      options: files,
      onchange: () => loadTexture(params.texture),
    })
  })

  let texture: Texture
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
        texture = result
        material.Texture = result
        material.TextureEnabled = true
      })
      .catch((e) => {
        console.error(e)
      })
  }

  const pass = device.renderPass
  function frame() {
    device.resize()

    updateCamera(mouse, camera, device)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.effect.draw(pass, geometry, material.parameters)

    pass.submit()
    pass.flush()
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

  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.Up).invert()
  camera.projection.initPerspectiveFieldOfView(
    45 * DEGREE_TO_RAD,
    device.output.aspectRatio,
    0.01,
    1000,
    device.ndcMinZ,
  )
}
