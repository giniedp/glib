import Gglib from '@gglib/gglib'
import { Device, ModelBuilder, ShaderEffect, CullState } from '@gglib/graphics';
import { Mat4 } from '@gglib/math';
import { loop } from '@gglib/core';

// # Effect (Materials)
//
// This example demonstrates how to use a shader program to render sevaral
// objects where each is rendered with different shader parameters.

// In Glib you can use a `ShaderEffect` for this task. It can hold one or multiple
// programs and a set of parameters. Before the program is used for rendering,
// all parameters are committed to that program.
//
// Here we will use only one program for the effect. Multi pass effects with
// multiple programs are explained in another example.
//
// ---

// Create the graphics device and pass the existing canvas element from the DOM.
let device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
let program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the mesh that should be rendered
let mesh = ModelBuilder.createMesh(device, 'Sphere', { steps: 96, radius: 0.45 })

// Create several effects.
// All effects share the same shader program. But each has its own set of parameters.
let size = 5
let effects: ShaderEffect[][] = []
for (let y = 0; y < size; y++) {
  effects[y] = effects[y] || []
  for (let x = 0; x < size; x++) {
    effects[y][x] = device.createEffect({
      program: program,
      parameters: {
        world: Mat4.createIdentity(),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
        specularPower: (x + y * size) / (size * size),
      },
    })
  }
}

// Begin the rendering loop
loop(() => {

  // Resize and clear the screen
  device.resize()
  device.clear(0xff2e2620, 1, 1)
  device.cullState = CullState.CullClockWise

  // Render the mesh for each effect.
  let aspect = device.context.drawingBufferWidth / device.context.drawingBufferHeight
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let effect = effects[y][x]
      effect.parameters.world.setTranslationXYZ(x - (size - 1) / 2, size - y - (size + 1) / 2, -2)
      effect.parameters.view.initTranslation(0, 0, -2)
      effect.parameters.projection.initPerspectiveFieldOfView(Math.PI / 3, aspect, 0, 100)
      effect.draw(mesh)
    }
  }
})
