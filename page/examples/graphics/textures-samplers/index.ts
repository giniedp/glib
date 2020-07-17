import { buildPlane, CullState, DeviceGL, ModelBuilder, SamplerState, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  context: 'webgl2',
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create a mesh which is going to be rendered
const mesh = ModelBuilder.begin().append(buildPlane).endMesh(device)

const texture = device.createTexture({
  width: 2,
  height: 2,
  pixelFormat: 'RGBA',
  pixelType: 'ubyte',
  data: [
    0xFF, 0x00, 0x00, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0x00, 0x00, 0xFF,
  ],
})

// Prepare some state variables
const world = Mat4.createRotationX(Math.PI * 0.5)
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()

// Begin the rendering loop
loop((time, dt) => {
  // prepare render state
  device.resize()
  device.cullState = CullState.CullClockWise
  device.clear(0xff2e2620, 1.0)

  // update view and projection matrices
  let aspect = device.drawingBufferWidth / device.drawingBufferHeight
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, aspect, 0, 100)

  // assign state to shader
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  program.setUniform('texture1', texture)
  program.setUniform('texture2', texture)
  program.setUniform('texture3', texture)
  program.setUniform('texture4', texture)

  mesh.draw(program)
})

TweakUi.build('#tweak-ui', (q) => {
  q.select(texture, 'samplerParams', {
    options: [
      { id: 'null', label: 'null', value: null },
      { id: 'LinearClamp', label: 'LinearClamp', value: SamplerState.LinearClamp },
      { id: 'LinearWrap', label: 'LinearWrap', value: SamplerState.LinearWrap },
      { id: 'PointClamp', label: 'PointClamp', value: SamplerState.PointClamp },
      { id: 'PointWrap', label: 'PointWrap', value: SamplerState.PointWrap },
    ],
  })
})
