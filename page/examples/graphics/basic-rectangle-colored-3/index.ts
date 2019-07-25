import { Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create an array of vertex buffers. This time each channel is extracted into
// its own vertex buffer.
const vertices = [
  device.createVertexBuffer({
    layout: { vPosition: { type: 'float', offset: 0, elements: 3  } },
    dataType: 'float',
    data: [
      -0.5, -0.5, 0.0,
      0.5, -0.5, 0.0,
      -0.5,  0.5, 0.0,
      0.5,  0.5, 0.0,
    ],
  }),
  device.createVertexBuffer({
    layout: { vColor: { type: 'ubyte', offset: 0, elements: 4, packed: true, normalize: true } },
    dataType: 'uint',
    data: [
      0xFF0000FF,
      0xFF00FF00,
      0xFFFF0000,
      0xFFFFFFFF,
    ],
  }),
]

// Create the index buffer.
const indices = device.createIndexBuffer({
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
  device.vertexBuffers = vertices

  // Now set the index buffer and then call `drawIndexedPrimitives`.
  // This is similar to 'drawPrimitives' but utilizes the index buffer.
  device.indexBuffer = indices
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
