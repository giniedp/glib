import { loop } from '@gglib/core'
import { CullState, Device, ModelBuilder } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'

// # Shader Annotations
// The GLSL shader attributes may contain annotation comments.
// The attributes may be given a different binding name (`@binding`)
// and they may be given a default value (`@default`). The annotations are optional and
// they are automatically processed when a shader program is created.
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

// Create a texture object.
// Simply pass an URL to the image that should be used as a texture.
let texture = device.createTexture({
  data: '/assets/textures/proto_red.png',
})

// Create Cube mesh which is going to be rendered
let mesh = ModelBuilder.begin().append('Cube').endMesh(device)

// Allocate state variables
let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()
let time = 0

// Begin render loop
// and accumulate the time
loop((dt) => {
  time += dt

  // prepare render state
  device.resize()
  device.cullState = CullState.CullClockWise
  device.clear(0xff2e2620, 1.0)

  // update the scene
  world.initRotationY(time / 1000)
  view.initTranslation(0, 0, -2)
  let aspect = device.context.drawingBufferWidth / device.context.drawingBufferHeight
  proj.initPerspectiveFieldOfView(Math.PI / 2, aspect, 0, 100)

  // Set shader variables. Mention that not the attribute names are used to set the values.
  // But instead their @binding names.
  program.setUniform('texture', texture)
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)

  // Render the mesh
  mesh.draw(program)
})
