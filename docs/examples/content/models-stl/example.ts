import { ContentLoader } from '@gglib/content'
import { BasicMaterial, BlendState, Color, CullState, PlatformId, createDevice } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { STL } from '@gglib/loaders'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi } from 'tweak-ui'

const models = {
  Logo: '/logo/gglib.stl',
  'Logo (binary)': '/logo/gglib-binary.stl',
  Bottle: '/models/stl/bottle.stl',
  Menger: '/models/stl/menger-sponge.stl',
  Cube: '/models/stl/cube.stl',
  CubeASCII: '/models/stl/cube.ascii.stl',
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready

  const content = new ContentLoader(device)
  content.registerLoader(STL.Loader)
  content.registerMaterial(BasicMaterial, () => true)

  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = Mat4.createIdentity()
  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  function loadModel(url: string) {
    content
      .loadModel(url)
      .then((result) => {
        model?.dispose()
        model = result
        model.update()
        sphere = model.boundingSphere.clone()
      })
      .catch((e) => {
        model = null
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
      camera.distance * sphere.radius * 2,
    ).add(sphere.center)

    camera.view.initLookAt(camera.position, sphere.center, Vec3.Up).invert()
    camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  function updateMaterials() {
    if (!model) {
      return
    }
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as BasicMaterial
        mtl.World = world
        mtl.View = camera.view
        mtl.Projection = camera.projection
        mtl.CameraPosition = camera.position
      }
    }
  }

  const pass = device.renderPass
  const rt = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const dt = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  function frame() {
    device.resize()
    rt.resizeToMatch(device.output)
    dt.resizeToMatch(device.output)

    pass.flush()
    pass.setRenderTarget(0, rt, 0, 0, device.output)
    pass.setDepthTarget(dt)
    pass.setCullState(CullState.CullBack)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (model) {
      updateCamera()
      updateMaterials()
      model.draw()
    }
    pass.resolve()
    pass.submit()
  }

  mountUi(tools, (ui) => {
    loadModel(models.Bottle)
    ui.select({ model: models.Bottle }, 'model', {
      options: models,
      onchange: (_, value) => loadModel(value as string),
    })
  })

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
