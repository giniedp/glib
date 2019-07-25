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

// Create the vertex buffer
const vertices = device.createVertexBuffer({
  layout: {
    // The layout of `vPosition` stays unchanged
    vPosition: { type: 'float', offset: 0, elements: 3  },
    // The `vTexture` specifies the layout of the texture coordinates
    vTexture: { type: 'float', offset: 12, elements: 2  },
  },
  data: [
    -0.5, -0.5, 0.0,   0, 1,
     0.5, -0.5, 0.0,   1, 1,
    -0.5,  0.5, 0.0,   0, 0,
     0.5,  0.5, 0.0,   1, 0,
  ],
})

// Create the index buffer.
const indices = device.createIndexBuffer({
  dataType: 'ushort',
  data: [0, 1, 2, 1, 2, 3],
})

// Create a texture object. We simply pass an URL as `data` option.
const texture = device.createTexture({
  data: '/assets/textures/prototype/proto_red.png',
})

// Begin render loop
loop(() => {

  // And assign the texture to the shader
  program.setUniform('uTexture', texture)

  // resize (if needed) and clear the screen
  device.resize()
  device.clear(0xff2e2620)

  // set the drawing state
  device.program = program
  device.indexBuffer = indices
  device.vertexBuffer = vertices

  // and render.
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
