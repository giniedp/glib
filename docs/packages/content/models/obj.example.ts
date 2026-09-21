import { AssetType, ContentLoader } from '@gglib/content'
import { MouseInput } from '@gglib/game'
import {
  BasicMaterial,
  BlendState,
  Color,
  createDevice,
  CullState,
  DepthState,
  PlatformId,
  SpriteBatch,
  TextureUsage,
} from '@gglib/graphics'
import { MTL, OBJ, TGA } from '@gglib/loaders'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi, redrawUi } from 'tweak-ui'

const models = {
  Tower: '/models/obj/tower-complete-large.obj',
  Ship: '/models/obj/ship-pirate-large.obj',
}
const params = {
  model: models.Tower,
  fov: 45,
  phi: 90,
  theta: 0,
  distance: 2,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready
  const content = new ContentLoader(device)
  content.registerLoader(OBJ.Loader)
  content.registerLoader(MTL.Loader)
  content.registerLoader(TGA.Loader)
  content.registerCreator(AssetType.Material, (ctx, options) => {
    const material = new BasicMaterial(ctx.device, options)
    material.AmbientColor = Color.Black
    return material
  })
  const mouse = new MouseInput()

  const stats = device.stats()
  mountUi(tools, (ui) => {
    loadModel(params.model)

    ui.select(params, 'model', { options: models, onchange: () => loadModel(params.model) })
    ui.scalar(params, 'fov', { range: true, min: 10, max: 120, step: 1 })
    ui.scalar(params, 'phi', { range: true, min: 0, max: 180, step: 1 })
    ui.scalar(params, 'theta', { range: true, min: 0, max: 360, step: 1 })
    ui.scalar(params, 'distance', { range: true, min: 0.1, max: 10, step: 0.1 })
  })

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = Mat4.createIdentity()
  const camera = {
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
        model.updateScene()
        sphere = model.boundingSphere.copy()
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
      }
    }

    model.draw()
  }

  const pass = device.renderPass
  const msaaColor = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const msaaDepth = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const color = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 1,
    usage: TextureUsage.TextureBinding,
  })
  const spriteBatch = new SpriteBatch(device)
  const clearColor = Color.CornflowerBlue.toLinear()
  function frame() {
    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)
    color.resizeToMatch(device.output)

    if (model) {
      updateCamera()
      updateModel(model)
    }

    pass.setRenderTarget(0, msaaColor, 0, 0, color)
    pass.setDepthTarget(msaaDepth)
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, clearColor)
    pass.clear()

    if (model) {
      renderModel(model)
    }
    pass.submit()
    pass.resolve()
    pass.flush()

    spriteBatch.linearToSrgb = true
    spriteBatch.begin()
    spriteBatch
      .next(color)
      .destination(0, 0, color.width, color.height)
      .flipY(device.isWebGL2 && color.isRenderTarget)
    spriteBatch.draw()

    device.stats(stats)
    redrawUi()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
