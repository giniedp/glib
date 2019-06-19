import { Device } from '@gglib/graphics'
import { Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'

// # Shaded Rectangle
// This example adds a more complex shader to the already textured rectangle.
// It requires us to keep track of some more variables and pass them to the shader program.
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

// Create the vertex buffer.
let vertices = device.createVertexBuffer({
  layout: {
    vPosition: { type: 'float', offset: 0, elements: 3  },
    vNormal: { type: 'float', offset: 12, elements: 3  },
    vTexture: { type: 'float', offset: 24, elements: 2  },
  },
  // type: 'ushort',
  // as the layout already indicates, we add a normal data to each vertex
  data: [
  ///   POSITION      NORMAL  TEXTURE
  /// X     Y    Z    X|Y|Z    U  V
    -0.5, -0.5, 0.0,  0, 0, 1,   0, 1,
      0.5, -0.5, 0.0,  0, 0, 1,   1, 1,
    -0.5,  0.5, 0.0,  0, 0, 1,   0, 0,
      0.5,  0.5, 0.0,  0, 0, 1,   1, 0,
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

// Define some variables that will be passed to the shader.
let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()
let camPosition = Vec3.create(0, 0, 1)
let lightDirection = Vec3.create(0, 0, -1)
let lightColor = Vec3.create(1, 1, 1)
let time = 0

// Begin render loop and accumulate the time
loop((dt) => {
  time += dt

  // resize (if needed) and clear the screen
  device.resize()
  device.clear(0xff2e2620)

  // rotate the rectangle, place the camera
  // and update projection with the aspect ration of the canvas
  world.initRotationY(time / 1000)
  view.initIdentity().setTranslation(camPosition).invert()
  let aspect = device.context.drawingBufferWidth / device.context.drawingBufferHeight
  proj.initPerspectiveFieldOfView(Math.PI / 2, aspect, 0, 100)

  // pass variables to the shader
  program.setUniform('uTexture', texture)
  program.setUniform('uWorld', world)
  program.setUniform('uView', view)
  program.setUniform('uProjection', proj)

  program.setUniform('uLightColor', lightColor)
  program.setUniform('uLightDirection', lightDirection)
  program.setUniform('uEyePosition', camPosition)
  program.setUniform('uSpecularPower', 16)

  // set drawing state
  device.program = program
  device.indexBuffer = indices
  device.vertexBuffer = vertices
  // and render
  device.drawIndexedPrimitives('TriangleList', 0, 6)
})
