import { buildCube, CullState, DepthState, DeviceGL, ModelBuilder, createDevice } from '@gglib/graphics'
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

// Create the mesh that should be rendered
const mesh = ModelBuilder.begin().append(buildCube).endMesh(device)
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const projection = Mat4.createIdentity()

const effect = device.createEffect({
  program: program,
  parameters: {
    world: world,
    view: view,
    projection: projection,
    texture1: device.createTexture({ data: '/assets/textures/prototype/proto_green.png' }),
    texture2: device.createTexture({ data: '/assets/textures/prototype/proto_red.png' }),
    texture3: device.createTexture({ data: '/assets/textures/prototype/proto_blue.png' }),
    texture4: device.createTexture({ data: '/assets/textures/prototype/proto_gray.png' }),
  },
})

// Begin the rendering loop
loop((time, dt) => {

  // Resize and clear the screen
  device.resize()
  device.clear(0xff2e2620, 1, 1)
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default

  // update scene state
  world.rotateYawPitchRoll(dt / 2000, dt / 4000, dt / 8000)
  view.initTranslation(0, 0, -2)
  projection.initPerspectiveFieldOfView(Math.PI / 3, device.drawingBufferAspectRatio, 0, 10)

  effect.draw(mesh)
})
