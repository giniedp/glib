import { loop } from '@gglib/core'
import { Device } from '@gglib/graphics'

// # Colored Rectangle
// The example is similar to the Colored triangle example.
// But this time an index buffer is used to define the drawing order of the vertices
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

// Create the vertex buffer. In this example each triangle vertex
// is defined by a position and a color attribute.
// The layout is the same as in previous example.
// The data gets an additional vertex.
let vertices = device.createVertexBuffer({
  layout: {
    vPosition: { type: 'float', offset: 0, elements: 3  },
    vColor: { type: 'float', offset: 12, elements: 3 },
  },
  data: [
    -0.5, -0.5, 0.0,   1,  0,  0, // The red vertex
      0.5, -0.5, 0.0,   0,  1,  0, // The green vertex
    -0.5,  0.5, 0.0,   0,  0,  1, // The blue vertex
      0.5,  0.5, 0.0,   1,  1,  1, // The white vertex
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
  device.resize()
  device.clear(0xff2e2620)

  device.program = program
  device.vertexBuffer = vertices

  // Now set the index buffer and then call `drawIndexedPrimitives`.
  // This is similar to 'drawPrimitives' but utilizes the index buffer.
  device.indexBuffer = indices
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
