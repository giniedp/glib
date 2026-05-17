import { ContentLoader } from '@gglib/content'
import { BasicMaterial, Color, createDevice, boxGeometry, CullState, DepthState, PlatformId } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
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

  content
    .loadTexture('/textures/backgrounds/colored_castle.png')
    .then((result) => {
      material.Texture = result
      material.TextureEnabled = 1
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
    camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  const rt = device.createRenderTarget({
    name: 'Main Render Target',
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const dt = device.createDepthTarget({
    name: 'Main Depth Target',
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const pass = device.renderPass
  function frame() {
    device.resize()
    rt.resizeToMatch(device.output)
    dt.resizeToMatch(device.output)

    updateCamera()
    pass.flush()
    pass.setRenderTarget(0, rt, 0, 0, device.output)
    pass.setDepthTarget(dt)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.CullBack)
    pass.clear()

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.effect.draw(pass, geometry, material.inputs)

    pass.submit()
    pass.resolve()
    pass.submit()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
