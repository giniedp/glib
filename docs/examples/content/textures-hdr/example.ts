import { ContentLoader } from '@gglib/content'
import { BasicMaterial, boxGeometry, Color, createDevice, Device, PlatformId, TaskContext } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { HDR } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const files = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
}
const params = {
  texture: files.Court,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const stats = device.stats()
  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  let dt = 0
  mountUi(tools, (ui) => {
    loadTexture(params.texture)
    ui.select(params, 'texture', {
      options: files,
      onchange: () => loadTexture(params.texture),
    })
    ui.graph({
      rows: [
        {
          name: 'fps',
          sample: () => (dt ? 1000 / dt : 0),
          min: 0,
          max: 200,
          smoothing: 0.5,
        },
      ],
    })
  })

  const material = new BasicMaterial(device)
  const geometry = boxGeometry(device)

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
        material.Texture = result
        material.TextureEnabled = 1
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
    camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  const pass = device.renderPass

  function frame(ctx: TaskContext) {
    dt = ctx.dt
    device.resize()
    updateCamera()
    pass.flush()
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.effect.draw(pass, geometry, material.inputs)
    pass.submit()
    device.stats(stats)
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

function demoCamera() {
  const data = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    update: (mouse: Mouse, device: Device) => updateCamera(data, mouse, device),
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
  camera.projection.initPerspectiveFieldOfView(
    45 * DEGREE_TO_RAD,
    device.output.aspectRatio,
    0.01,
    1000,
    device.ndcMinZ,
  )
}
