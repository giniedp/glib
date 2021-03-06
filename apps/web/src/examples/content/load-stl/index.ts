import { ContentManager } from '@gglib/content'
import { LightParams } from '@gglib/fx-materials'
import { BlendState, CullState, DepthState, DeviceGL, Model, createDevice } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const models = {
  Logo: '/assets/logo/gglib.stl',
  "Logo (binary)": '/assets/logo/gglib-binary.stl',
  Bottle: '/assets/models/stl/bottle.stl',
  Cube: '/assets/models/stl/cube.stl',
  CubeASCII: '/assets/models/stl/cube.ascii.stl',
}

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create the content manager
const content = new ContentManager(device)
const light = LightParams.createDirectionalLight({
  direction: Vec3.Forward,
  color: Vec3.One,
})

// Declare scene variables
const controls = {
  distance: 1.5,
  offset: 0,
  fov: 90,
  update: true,
}
let model: Model = null
let scale = 1

// This is called every time a model has been selected
// In case of an error the model will not be rendered
// and the error will be logged to console
function loadModel(url: string) {
  content.load(url, Model).then((result) => {
    model = result
    if (model) {
      scale = 1 / model.meshes[0].boundingSphere.radius
    }
  }).catch((e) => {
    model = null
    console.error(e)
  })
}

// Declare runtime variables
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

// Begin the rendering loop and accumulate the time
let gameTime = 0
loop((time, dt) => {
  if (controls.update) {
    gameTime += dt
  }

  // Resize and clear the screen
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  // Do not proceed until model is loaded
  if (!model) {
    return
  }

  // Update runtime variables
  const bs = model.meshes[0].boundingSphere
  world
    .initScaleUniform(scale)
    .rotateY(gameTime / 4000)
    .translate(-bs.center.x, -bs.center.y, -bs.center.z)

  cam.initLookAt(
    { x: 0, y: controls.offset, z: controls.distance },
    Vec3.Zero,
    Vec3.Up,
  )
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(controls.fov * Math.PI / 180, device.drawingBufferAspectRatio, 0.001, 10)

  // Update materials
  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((material) => {
      const params = material.parameters

      params.World = world
      params.View = view
      params.Projection = proj
      params.CameraPosition = cam.getTranslation()
      light.assign(0, params)
    })
  })

  // Draw the model.
  // In case of an error the model is cleared and the error is logged to console
  try {
    model.draw()
  } catch (e) {
    console.error(e)
    model = null
  }
})

// Allow scene variables to be manipulated via gui controls
TweakUi.mount('#tweak-ui', (ui) => {
  loadModel(models.Bottle)
  ui.select({ model: models.Bottle }, 'model', {
    options: models,
    onChange: (it, value: string) => loadModel(value),
  })
  ui.slider(controls, 'distance', { min: 0.01, max: 3, label: 'Camera distance' })
  ui.slider(controls, 'offset', { min: -3, max: 3, label: 'Camera height' })
  ui.slider(controls, 'fov', { min: 1, max: 120, step: 1 })
  ui.checkbox(controls, 'update')
})
