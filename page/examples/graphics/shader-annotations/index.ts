import { buildCube, CullState, DeviceGL, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
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

// Create a texture object.
// Simply pass an URL to the image that should be used as a texture.
const texture = device.createTexture({
  source: '/assets/textures/prototype/proto_red.png',
})

// Create Cube mesh which is going to be rendered
const mesh = ModelBuilder.begin().append(buildCube).endMeshPart(device)

// Allocate state variables
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()

// Begin render loop
loop((time, dt) => {

  // prepare render state
  device.resize()
  device.cullState = CullState.CullClockWise
  device.clear(0xff2e2620, 1.0)

  // update the scene
  world.initRotationY(time / 2000)
  view.initTranslation(0, 0, -1.25)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

  // Set shader variables. Mention that not the attribute names are used to set the values.
  // But instead their @binding names.
  program.setUniform('texture', texture)
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)

  // Render the mesh
  mesh.draw(program)
})
