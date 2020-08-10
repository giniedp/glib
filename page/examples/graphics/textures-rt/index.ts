import { buildCube, buildPlane, CullState, DepthFormat, DeviceGL, ModelBuilder } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
let device = new DeviceGL({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
let program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the geometry
let mesh = ModelBuilder.begin().append(buildPlane).endMeshPart(device)

// Create a texture and a render target
let texture = device.createTexture({
  data: '/assets/textures/prototype/proto_red.png',
})
let renderTarget = device.createRenderTarget({
  width: 512,
  height: 512,
  depthFormat: DepthFormat.DepthStencil,
})

let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()

// In the render loop
loop((time, dt) => {

  // ## Step 1
  // update state variables
  world
  .initIdentity()
  .preRotateX(Math.PI * 0.5)
  .preRotateZ(Math.PI * time / 10000)
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, 1, 0, 100)
  // and pass them to the shader
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  program.setUniform('texture', texture)

  // set the render target and clear the color
  device.setRenderTarget(renderTarget)
  device.clear(0xFF0088FF, 1.0)

  // draw the mesh and unset the render target again.
  mesh.draw(program)
  device.setRenderTarget(null)

  // The render target holds the image of the plane that we
  // just rendered and can now be used as a texture in the next step.

  // ## Step 2
  // Resize and lcear the backbuffer
  device.resize()
  device.clear(0xff2e2620, 1.0)
  // Our geometry is spinning and we will see it from front and back side, so disable culling.
  device.cullState = CullState.CullNone

  // update state variables
  world
  .initIdentity()
  .preRotateX(Math.PI * 0.5)
  .preRotateY(Math.PI * time / 10000)
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0, 100)
  // and pass them to the shader
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  // here the render target is used as a texture
  program.setUniform('texture', renderTarget)

  // draw the cube with the prepared shader
  mesh.draw(program)
})
