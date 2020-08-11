import { buildCube, CullState, DepthFormat, DeviceGL, ModelBuilder, DepthState, TextureWrapMode, TextureFilter } from '@gglib/graphics'
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
let mesh = ModelBuilder.begin().append(buildCube).endMeshPart(device)

// Create a cubemap. The `faces` option must contain 6 entries.
let texture = device.createTextureCube({
  faces: [
    '/assets/textures/prototype/proto_red.png',
    '/assets/textures/prototype/proto_red.png',
    '/assets/textures/prototype/proto_green.png',
    '/assets/textures/prototype/proto_green.png',
    '/assets/textures/prototype/proto_blue.png',
    '/assets/textures/prototype/proto_blue.png',
  ],
  samplerParams: {
    minFilter: TextureFilter.Linear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
    wrapW: TextureWrapMode.Clamp,
  }
})

let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()

loop((time) => {
  device.resize()
  device.clear(0xff2e2620, 1.0)
  device.depthState = DepthState.Default
  device.cullState = CullState.CullCounterClockWise

  world.initIdentity()
    .rotateX((Math.PI * time) / 10000)
    .rotateY((Math.PI * time) / 20000)
    .rotateZ((Math.PI * time) / 30000)
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0, 100)

  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  program.setUniform('texture', texture)

  mesh.draw(program)
})
