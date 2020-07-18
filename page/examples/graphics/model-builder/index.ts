// # Model Builder
//
// ---

import { ContentManager } from '@gglib/content'
import { CullState, DeviceGL, Model, ModelBuilder, ShaderEffect, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create an instance of the Content.Manager and give it a reference to the device.
const content = new ContentManager(device)

// This will hold the final model object
let model: Model = null

// But first start loading a ShaderEffect
content.load('./effect.ggfx', ShaderEffect).then((effect) => {

  // With a ModelBuilder you can create a 3D Model by adding Vertices and Indices.
  // Don't care about the vertex layout for now. The ModelBuilder has feasable defaults.
  const builder = new ModelBuilder()

  // Now add 4 vertices to shape a square plane
  // with texture coordinates
  builder.addVertex({
    position: [-1, 1, 0],
    texture:  [ 0, 0],
  })
  builder.addVertex({
    position: [1, 1, 0],
    texture:  [1, 0],
  })
  builder.addVertex({
    position: [-1, -1, 0],
    texture:  [ 0,  1],
  })
  builder.addVertex({
    position: [1, -1, 0],
    texture:  [1,  1],
  })

  // Connect those vertices by adding some indices to form a triangle list
  builder.addIndex(0)
  builder.addIndex(1)
  builder.addIndex(2)
  builder.addIndex(1)
  builder.addIndex(3)
  builder.addIndex(2)

  // To finish the model call `builder.endModel` and give it some material options.
  // Thats it for a simple model. The `ModelBuilder` is helpful when writing
  // model importers.
  model = builder.closeMesh({
    materials: [{
      effect: effect,
      parameters: {},
    }],
  }).endModel(device)
})

// allocate scene variables
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()

// Start a game loop
loop((time, dt) => {

  device.resize()
  device.cullState = CullState.CullNone
  device.clear(0xff2e2620, 1.0)

  // do not proceed if model is still not loaded
  if (!model) {
    return
  }

  // update scene variables
  view.initTranslation(0, 0, -2)

  const aspect = device.drawingBufferWidth / device.drawingBufferHeight
  proj.initPerspectiveFieldOfView(Math.PI / 2, aspect, 0, 100)

  // apply material parameters
  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((material) => {
      material.parameters.world = world
      material.parameters.view = view
      material.parameters.projection = proj
    })
  })

  // draw the loaded model
  model.draw()
})
