import { Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

// # Hello Triangle
//
// This example shows how to render primitive geometry using the gglib graphics package.
// The steps can be summarized as follows:
// 1. Instantiate the graphics `Device`.
// 2. Create a program with a vertex and a fragment shader.
// 3. Create a vertex buffer.
// 4. Use the graphics device to draw the vertex buffer with the program.
//
// ---

// Instantiate the graphics device by passing an existing canvas element as an option.

let device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
let program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the vertex buffer. In this example each triangle vertex
// is defined by a position attribute.
//
// The `layout` option describes how the `data` is structured.
// Our vertex shader expects a vertex attribute with the name `vPosition` of type `vec3`.
//
// The `data` is simply a sequence of floats.
// Each 3 floats define a vertex position
let vertices = device.createVertexBuffer({
  layout: {
    vPosition: {
      type: 'float', offset: 0, elements: 3,
    },
  },
  data: [
    -0.5, -0.5, 0.0, // vertex 1
     0.5, -0.5, 0.0, // vertex 2
     0.0,  0.5, 0.0, // vertex 3
  ],
})

// Start a loop function.
loop(() => {
  // If the size of the canvas is controlled by css (as it is on this page)
  // this call will resize the drawing buffer to match the new size of the canvas.
  device.resize()

  // Clear the screen.
  device.clear(0xff2e2620)

  // Now render the vertex buffer with the program.
  // The call to `drawPrimitives` instructs to
  // - draw the vertex buffer as a TriangleList
  // - starting at the beginning of the buffer (`0` offset)
  // - and draw only 3 vertices
  device.vertexBuffer = vertices
  device.program = program
  device.drawPrimitives('TriangleList', 0, 3)
})
