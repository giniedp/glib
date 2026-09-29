import { AssetType, ContentLoader } from '@gglib/content'
import { MouseInput } from '@gglib/game'
import { BasicMaterial, BlendState, Color, createDevice, CullState, PlatformId } from '@gglib/graphics'
import { STL } from '@gglib/loaders'
import {
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$invert,
  mat4Identity,
  vec3,
  vec3$add,
  vec3$initSpherical,
} from '@gglib/math'
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
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(STL.Loader)
  content.registerCreator(AssetType.Material, (ctx, options) => {
    const material = new BasicMaterial(ctx.device, options)
    material.AmbientColor = Color.Black
    return material
  })

  const mouse = new MouseInput()

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = mat4Identity()
  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: vec3(),
    view: mat4Identity(),
    projection: mat4Identity(),
  }

  function loadModel(url: string) {
    content
      .loadModel(url)
      .then((result) => {
        model?.dispose()
        model = result
        model.update()
        sphere = model.boundingSphere.copy()
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
    vec3$initSpherical(camera.position,
      camera.phi * DEGREE_TO_RAD,
      camera.theta * DEGREE_TO_RAD,
      camera.distance * sphere.radius * 2,
    )
    vec3$add(camera.position, sphere.center)

    mat4$initLookAt(camera.view, camera.position, sphere.center, vec3.UnitY)
    mat4$invert(camera.view)
    mat4$initPerspectiveFieldOfView(
      camera.projection,
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
    format: 'depth24plus',
    sampleCount: 4,
  })
  function frame() {
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

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
