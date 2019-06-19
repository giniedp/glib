// # Colored Rectangle
// ## packed attributes
// In the previous example the color attribute of a vertex was made of 3 floats.
// In this example that attribute is going to be changed into a 4 byte value.
//
// ---

import { Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

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

// Create the vertex buffer
let vertices = device.createVertexBuffer({
  layout: {
    // The layout of `vPosition` keeps unchanged
    vPosition: { type: 'float', offset: 0, elements: 3  },
    // The `vColor` is now defined as a 4 ubyte element.
    vColor: {
      type: 'ubyte',
      offset: 12,
      elements: 4,
      // this indicates that the 4 elements are packed in a single value
      packed: true,
      // this indicates that a byte value should be normalized
      // into [0:1] range before it is utilized in the vertex shader stage
      normalize: true,
    },
  },

  // Color values are also changed in the data buffer.
  dataType: 'float',
  data: [
    -0.5, -0.5, 0.0,   0xFF0000FF,
     0.5, -0.5, 0.0,   0xFF00FF00,
    -0.5,  0.5, 0.0,   0xFFFF0000,
     0.5,  0.5, 0.0,   0xFFFFFFFF,
  ],
})

// Create the index buffer.
let indices = device.createIndexBuffer({
  dataType: 'ushort',
  data: [
    0, 2, 1,
    1, 2, 3,
  ],
})

loop(() => {
  // resize (if needed) and clear the screen
  device.resize()
  device.clear(0xff2e2620)

  // set the drawing state
  device.program = program
  device.vertexBuffer = vertices
  device.indexBuffer = indices
  // and render.
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
