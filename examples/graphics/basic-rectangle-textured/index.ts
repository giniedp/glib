import { Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

// # A Textured Rectangle
// This example again renders a simple rectangle. But this time
// texture coordinates are added to the vertex buffer. Also
// a texture has to be loaded and passed to the fragment shader.
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

// Create the vertex buffer
let vertices = device.createVertexBuffer({
  layout: {
    // The layout of `vPosition` keeps unchanged
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
let indices = device.createIndexBuffer({
  dataType: 'ushort',
  data: [0, 1, 2, 1, 2, 3],
})

// Create a texture object.
// Simply pass an URL to the image that should be used as a texture.
let texture = device.createTexture({
  data: '/assets/textures/proto_red.png',
})

// Begin render loop
loop(() => {
  // resize (if needed) and clear the screen
  device.resize()
  device.clear(0xff2e2620)

  // Update the texture in the shader
  program.setUniform('uTexture', texture)

  // set the drawing state
  device.program = program
  device.indexBuffer = indices
  device.vertexBuffer = vertices

  // and render.
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
