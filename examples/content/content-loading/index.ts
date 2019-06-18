// # Content loading
//

import { Manager } from '@gglib/content'
import { loop } from '@gglib/core'
import { CullState, Device, Model } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'

// This example demonstrates how assets can be loaded by using the `Content.Manager`.
// For the demonstration three assets are embedded in the DOM as `script` tags.
// The contents of the script tags are the actual assets in text form. The assets are:
//
// 1. A **Model**:
// The model references one material file, the `material.ggmat` and also defines an
// array of meshes.
//
// 2. A **Material**:
// The material references an effect file, the `effect.ggfx` and also defines several
// effect parameters
//
// 3. An **Effect**:
// The effect is a yaml formatted file that contains the vertex and fragment shaders.
//
// All three `script` tags have an`id` which the content manager will look for when loading the assets.
//
// Ofc. the assets could be actual files at some remote location. They are not required to be
// in `script` tags in the DOM.
//
// ---

// Create the graphics device and pass the existing canvas element from the DOM.
let device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})
// Create the content manager and start loading the demo model asynchronously.
// All referenced assets like the material and effect will also be loaded
// and associated with the model.
let content = new Manager(device)
let model: Model = null
content.load('./model.ggmod', Model).then((result) => {
  model = result
})

// allocate scene variables
let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()

//
loop(() => {

  device.resize()
  device.cullState = CullState.CullNone
  device.clear(0xff2e2620, 1.0)

  // do not proceed if model is still not loaded
  if (!model) {
    return
  }

  // update scene variables
  // world.initRotationY(time / 1000);
  view.initTranslation(0, 0, -2)
  let aspect = device.context.drawingBufferWidth / device.context.drawingBufferHeight
  proj.initPerspectiveFieldOfView(Math.PI / 2, aspect, 0, 100)

  // apply material parameters
  model.materials.forEach((material) => {
    material.parameters.world = world
    material.parameters.view = view
    material.parameters.projection = proj
    material.parameters.eyePosition = { x: 0, y: 0, z: 2 }
  })

  // draw the loaded model
  model.draw()
})
