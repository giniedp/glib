import { buildCube, buildPlane, CullState, DepthFormat, Device, ModelBuilder } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// # Render Targets
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

// Create meshes which are going to be rendered
let planeMesh = ModelBuilder.begin().tap(buildPlane).endMesh(device)
let cubeMesh = ModelBuilder.begin().tap(buildCube).endMesh(device)

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

// Begin the render loop and accumulate the time
let time = 0
loop((dt) => {
  time += dt

  // Begin rendering to the render target by setting it to the device and clear it
  device.setRenderTarget(renderTarget)
  device.clear(0xFF888888, 1.0)

  // update state variables
  // and pass them to the shader
  world.initRotationX(Math.PI * 0.5)
  world.setTranslationZ(Math.sin(Math.PI * time / 2000) - 1)
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, 1, 0, 100)

  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  program.setUniform('texture', texture)

  // draw the plane with the prepared shader
  planeMesh.draw(program)

  // unset the render target. The render target now holds the image of the plane that we
  // just rendered. The target can now be used as a tecture
  device.setRenderTarget(null)

  // Now continue rendering to the backbuffer. Resize and clear the backbuffer
  device.resize()
  device.clear(0xff2e2620, 1.0)
  device.cullState = CullState.CullClockWise

  // update state variables
  // and pass them to the shader
  world.initRotationY(Math.PI * time / 10000)
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0, 100)

  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  // here the render target is used as a texture
  program.setUniform('texture', renderTarget)

  // draw the cube with the prepared shader
  cubeMesh.draw(program)
})
