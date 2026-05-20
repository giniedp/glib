import { ContentLoader } from '@gglib/content'
import { BasicMaterial, BlendState, Color, CullState, DepthState, PlatformId, createDevice } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { MTL, OBJ, TGA } from '@gglib/loaders'
import { LightParams } from '@gglib/materials'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi, redrawUi } from 'tweak-ui'
import { Pane } from 'tweakpane'

const models = {
  Tower: '/models/obj/tower-complete-large.obj',
  Ship: '/models/obj/ship-pirate-large.obj',
  Tree: '/models/obj/tree.obj',
  Cube: '/models/obj/cube.obj',
}
const params = {
  model: models.Tower,
  fov: 45,
  phi: 90,
  theta: 0,
  distance: 2,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  content.registerLoader(OBJ.Loader)
  content.registerLoader(MTL.Loader)
  content.registerLoader(TGA.Loader)
  content.registerMaterial(BasicMaterial, () => true)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const stats = device.stats()
  mountUi(tools, (ui) => {
    loadModel(params.model)

    ui.select(params, 'model', { options: models, onchange: () => loadModel(params.model) })
    ui.number(params, 'fov', { slider: true, min: 10, max: 120, step: 1 })
    ui.number(params, 'phi', { slider: true, min: 0, max: 180, step: 1 })
    ui.number(params, 'theta', { slider: true, min: 0, max: 360, step: 1 })
    ui.number(params, 'distance', { slider: true, min: 0.1, max: 10, step: 0.1 })
  })

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = Mat4.createIdentity()
  const camera = {
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  const light1 = LightParams.createDirectionalLight({
    direction: Vec3.create(-1, -1, -1),
    color: Vec3.One,
  })
  const light2 = LightParams.createDirectionalLight({
    direction: Vec3.create(1, 1, 1),
    color: Vec3.One,
  })

  function loadModel(url: string) {
    content
      .loadModel(url)
      .then((result) => {
        model?.dispose()
        model = result
        model.updateScene()
        sphere = model.boundingSphere.clone()
      })
      .catch((e) => {
        model = null!
        console.error(e)
      })
  }

  function updateCamera() {
    mouse.update()
    if (mouse.leftButtonIsPressed) {
      params.theta -= mouse.dxNormalized * 360
      params.phi -= mouse.dyNormalized * 180
    }
    if (mouse.middleButtonIsPressed) {
      params.distance += mouse.dyNormalized * 2
      params.distance = Math.max(0.1, params.distance)
    }

    // prettier-ignore
    camera.position.initSpherical(
      params.phi * DEGREE_TO_RAD,
      params.theta * DEGREE_TO_RAD,
      params.distance * sphere.radius * 2,
    ).add(sphere.center)

    camera.view.initLookAt(camera.position, sphere.center, Vec3.UnitY).invert()
    camera.projection.initPerspectiveFieldOfView(
      params.fov * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  function updateModel(model: Model) {
    //
  }

  function renderModel(model: Model) {
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as BasicMaterial
        mtl.World = world
        mtl.View = camera.view
        mtl.Projection = camera.projection
        mtl.TextureEnabled = true
      }
    }

    model.draw()
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

    if (model) {
      updateCamera()
      updateModel(model)
    }

    pass.setRenderTarget(0, rt, 0, 0, device.output)
    pass.setDepthTarget(dt)
    pass.setCullState(CullState.CullBack)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setDepthState(DepthState.LessEqual)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (model) {
      renderModel(model)
    }
    pass.resolve()
    pass.submit()
    pass.flush()

    device.stats(stats)
    redrawUi()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}
