import { ContentLoader } from '@gglib/content'
import { BlendState, CullState, DepthState, createDevice } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { MTL, OBJ, TGA } from '@gglib/loaders'
import { AutoMaterial, LightParams } from '@gglib/materials'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  // Create the graphics device and pass the existing canvas element from the DOM.
  const device = createDevice({ canvas })
  const content = new ContentLoader(device)
  content.registerLoader(OBJ.Loader)
  content.registerLoader(MTL.Loader)
  content.registerLoader(TGA.Loader)
  content.registerMaterial({
    name: 'BasicEffect',
    type: AutoMaterial,
  })
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const models: Record<string, string> = {
    Tower: '/assets/models/obj/piratekit/tower.obj',
    Cannon: '/assets/models/obj/piratekit/cannonMobile.obj',
    Chest: '/assets/models/obj/piratekit/chest.obj',
    Boat: '/assets/models/obj/piratekit/boat_large.obj',
    Bottle: '/assets/models/obj/piratekit/bottle.obj',
    Paddle: '/assets/models/obj/piratekit/paddle.obj',
    Palm: '/assets/models/obj/piratekit/palm_detailed_long.obj',
    Pirate: '/assets/models/obj/piratekit/pirate_captain.obj',
    Plant: '/assets/models/obj/piratekit/plant.obj',
    Shovel: '/assets/models/obj/piratekit/shovel.obj',
    Sword: '/assets/models/obj/piratekit/sword.obj',
    'Ship Dark': '/assets/models/obj/piratekit/ship_dark.obj',
    'Ship Light': '/assets/models/obj/piratekit/ship_light.obj',
    Tree: '/assets/models/obj/medieval/tree.obj',
  }
  TweakUi.mount(tools, (ui) => {
    loadModel(models.Tower)
    ui.select({ model: models.Tower }, 'model', {
      options: models,
      onChange: (it, value) => loadModel(value as string),
    })
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
        console.log(`Model loaded: ${url}`, model)
      })
      .catch((e) => {
        model = null!
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
    camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
  }

  function updateModel(model: Model) {
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as AutoMaterial
        mtl.LightCount = 2
        mtl.World = world
        mtl.View = camera.view
        mtl.Projection = camera.projection

        light1.assign(0, mtl.parameters)
        light2.assign(1, mtl.parameters)
      }
    }
  }

  function renderModel(model: Model) {
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as AutoMaterial
        mtl.ShadeFunction = 'shadePhong'
        mtl.LightCount = 2
        mtl.World = world
        mtl.View = camera.view
        mtl.Projection = camera.projection

        light1.assign(0, mtl.parameters)
        light2.assign(1, mtl.parameters)
      }
    }

    model.draw()
  }

  function frame(time: number, dt: number) {
    device.resize()
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.clear(0xff2e2620, 1.0)

    if (model) {
      updateCamera()
      updateModel(model)
      renderModel(model)
    }
  }

  const looper = loop(frame)
  return () => {
    looper.stop()
    model?.dispose()
  }
}
