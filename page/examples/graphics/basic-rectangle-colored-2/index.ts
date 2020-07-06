import { DeviceGL } from '@gglib/graphics'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new DeviceGL({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the vertex buffer
const vertices = device.createVertexBuffer({
  layout: {
    // The layout of `vPosition` stays unchanged
    vPosition: { type: 'float', offset: 0, elements: 3  },
    // The `vColor` is now defined as a 4 ubyte element.
    vColor: {
      offset: 12,
      elements: 4,   // 4 elements
      type: 'ubyte', // of unsigned byte type
      packed: true,  // but all 4 are packed in a single 32bit value
      // this indicates that a byte value should be normalized
      // into [0:1] range before it is utilized in the vertex shader stage
      normalize: true,
    },
  },

  // Each color attribute is now a 32bit color value in RGBA format.
  dataType: 'float',
  data: [
    -0.5, -0.5, 0.0,   0xFF0000FF,
     0.5, -0.5, 0.0,   0xFF00FF00,
    -0.5,  0.5, 0.0,   0xFFFF0000,
     0.5,  0.5, 0.0,   0xFFFFFFFF,
  ],
})

// Create the index buffer.
const indices = device.createIndexBuffer({
  dataType: 'ushort',
  data: [
    0, 2, 1,
    1, 2, 3,
  ],
})

loop(() => {
  // resize (if needed) and clear the screen
  device.resize()
  device.clear(0xff222222)

  // set the drawing state
  device.program = program
  device.vertexBuffer = vertices
  device.indexBuffer = indices
  // and render.
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
