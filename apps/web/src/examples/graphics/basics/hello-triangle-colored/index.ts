import { DeviceGL, createDevice } from '@gglib/graphics'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the vertex buffer as seen in the previous example.
const vertices = device.createVertexBuffer({
// The `layout` describes that each vertex begins with a `vPosition` attribute
// which is a `vec3` with 3 elements.
  layout: {

    vPosition: {
      type: 'float', offset: 0, elements: 3,
    },
    // It is then followed byt a `vColor` attribute which is also a `vec3` with 3 elements
    // but has an offset of 12 bytes from the beginning of the vertex.
    vColor: {
      type: 'float', offset: 12, elements: 3,
    },
  },
  // The `data` is a sequence of floats that matches the `layout` specification.
  // Each 6 floats define a vertex where the first 3 floats are a `vPosition`
  // and the next 3 floats are the `vColor`
  data: [
    /* position */ -0.5, -0.5, 0.0, /* color */  1,  0,  0,
    /* position  */ 0.5, -0.5, 0.0, /* color */  0,  1,  0,
    /* position  */ 0.0,  0.5, 0.0, /* color */  0,  0,  1,
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
