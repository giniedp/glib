
// # OBJ Models
//
// Glib is able to load OBJ models.
//
// ---

import { ContentManager } from '@gglib/content'
import { LightParams } from '@gglib/effects'
import { BlendState, CullState, DepthState, Device, LightType, Model } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const baseUrl = '/assets/models/obj/'
const models = {
  Capsule:          `${baseUrl}capsule/capsule.obj`,
  Ghoul:            `${baseUrl}ghoul/ghoul.obj`,
  'Mitsuba Scene':  `${baseUrl}mitsuba-knob/mitsuba.obj`,
  'Mitsuba Sphere': `${baseUrl}mitsuba-knob/mitsuba-sphere.obj`,
  'Mori Knob':      `${baseUrl}mori-knob/mori-knob.obj`,
  'Round Cube':     `${baseUrl}roundcube/roundcube.obj`,
}

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create the content manager
const content = new ContentManager(device)
const light = new LightParams()
light.enabled = true
light.type = LightType.Directional
light.color = [1, 1, 1]
light.direction = [-1, -1, -1]

// Declare scene variables
let model: Model = null
let scale = 1
const controls = {
  distance: 1.5,
  offset: 0,
  fov: 90,
  update: true,
}
// Allow scene variables to be manipulated via gui controls
TweakUi.build('#tweak-ui', (q) => {
  loadModel(models.Ghoul)
  q.select({ model: models.Ghoul }, 'model', {
    options: models,
    onChange: (it, value) => loadModel(value),
  })
  q.slider(controls, 'distance', { min: 0.01, max: 3 })
  q.slider(controls, 'offset', { min: -3, max: 3})
  q.slider(controls, 'fov', { min: 1, max: 120, step: 1 })
  q.checkbox(controls, 'update')
})

// This is called every time a model has been selected
// In case of an error the model will not be rendered
// and the error will be logged to console
function loadModel(url: string) {
  content.load(url, Model).then((result) => {
    model = result
    if (model) {
      scale = 1 / model.boundingSphere.radius
      console.log(model)
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
let time = 0
loop((dt) => {
  if (controls.update) {
    time += dt
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
  world
    .initTranslation(-model.boundingSphere.center.x, -model.boundingSphere.center.y, -model.boundingSphere.center.z)
    .rotateY(time / 4000)
    .scaleUniform(scale)
  cam.initLookAt(
    { x: 0, y: controls.offset, z: controls.distance },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  )
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(controls.fov * Math.PI / 180, device.drawingBufferAspectRatio, 0.001, 10)

  // Update materials
  model.materials.forEach((material) => {
    const params = material.parameters

    params.World = world
    params.View = view
    params.Projection = proj
    params.CameraPosition = cam.getTranslation()

    // Update light properties
    light.assign(0, params)
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
