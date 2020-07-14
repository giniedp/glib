import { ContentManager } from '@gglib/content'
import { CullState, Model, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: '#canvas',
})

// Create the content manager. It needs an instance of the graphics device.
const content = new ContentManager(device)

// Now start loading the model asynchronously.
// The `load` method takes 2 arguments. The first is the asset URL
// and the second identifies the type of the loaded asset. In this case
// we load a `Model`
let model: Model = null
content.load('./model.ggmod', Model).then((result) => {
  model = result
})

// Allocate scene variables
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()

// Run the rendering loop
loop(() => {

  // Resize and prepare the device
  device.resize()
  device.cullState = CullState.CullNone
  device.clear(0xff2e2620, 1.0)

  // Abort if model is not loaded
  if (!model) {
    return
  }

  // Update scene variables
  view.initTranslation(0, 0, -1.5)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0, 100)

  // Apply material parameters
  model.materials.forEach((material) => {
    material.parameters.world = world
    material.parameters.view = view
    material.parameters.projection = proj
    material.parameters.eyePosition = { x: 0, y: 0, z: 1.5 }
  })

  // Draw the loaded model
  model.draw()
})
