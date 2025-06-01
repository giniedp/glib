import { ContentLoader } from '@gglib/content'
import { BlendState, CullState, DepthState, createDevice } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { STL } from '@gglib/loaders'
import { LightParams } from '@gglib/materials'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Transform, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const models = {
  Logo: '/assets/logo/gglib.stl',
  'Logo (binary)': '/assets/logo/gglib-binary.stl',
  Bottle: '/assets/models/stl/bottle.stl',
  Menger: '/assets/models/stl/menger-sponge.stl',
  Cube: '/assets/models/stl/cube.stl',
  CubeASCII: '/assets/models/stl/cube.ascii.stl',
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const content = new ContentLoader(device)
  content.registerLoader(STL.Loader)
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
        console.log(`Model loaded: ${url}`, {
          model,
          sphere,
        })
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
    camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
  }

  function updateMaterials() {
    if (!model) {
      return
    }
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const params = material.parameters
        params.World = world
        params.View = camera.view
        params.Projection = camera.projection
      }
    }
  }

  function renderModel() {
    if (model) {
      model.draw()
    }
  }

  function frame(time: number, dt: number) {
    device.resize()
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.clear(0xff2e2620, 1.0)

    if (!model) {
      return
    }
    updateCamera()
    updateMaterials()
    renderModel()
  }

  TweakUi.mount(tools, (ui) => {
    loadModel(models.Bottle)
    ui.select({ model: models.Bottle }, 'model', {
      options: models,
      onChange: (it, value) => loadModel(value as string),
    })
  })

  const looper = loop(frame)
  return () => {
    looper.stop()
    model?.dispose()
  }
}
