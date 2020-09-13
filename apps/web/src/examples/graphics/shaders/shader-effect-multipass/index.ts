import { BlendState, buildSphere, CullState, DepthState, ModelBuilder, createDevice, ShaderEffect, buildCube, buildIcosahedron } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.

const effect = device.createEffect({
  name: 'Multipass Effect',
  techniques: [{
    passes: [{
      name: 'outline pass',
      blendState: BlendState.Default,
      depthState: DepthState.DepthRead,
      program: device.createProgram({
        vertexShader: document.getElementById('vertex-shader').textContent,
        fragmentShader: document.getElementById('fragment-shader').textContent,
      }),
    }, {
      name: 'overlay pass',
      blendState: BlendState.Default,
      depthState: DepthState.Default,
      program: device.createProgram({
        vertexShader: document.getElementById('vertex-shader2').textContent,
        fragmentShader: document.getElementById('fragment-shader2').textContent,
      }),
    }],
  }],
})

let size = 5
let effects: ShaderEffect[][] = []
for (let y = 0; y < size; y++) {
  effects[y] = effects[y] || []
  for (let x = 0; x < size; x++) {
    effects[y][x] = device.createEffect({
      techniques: effect.techniques,
      parameters: {
        world: Mat4.createIdentity(),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
        diffuseColor: [Math.random(), Math.random(), Math.random()],
        lightColor: [0.7, 0.7, 0.7],
        outlineColor: [Math.random(), Math.random(), Math.random()],
      },
    })
  }
}

// Create Cube mesh which is going to be rendered
const mesh = ModelBuilder.begin().append(buildIcosahedron).endMeshPart(device)

// Begin render loop
loop((time, dt) => {

  // prepare render state
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      draw(time, effects[y][x], x, y)
    }
  }
})

function draw(time: number, effect: ShaderEffect, x: number, y: number) {
  const aspect = device.drawingBufferAspectRatio
  effect.getParameter<Mat4>('world').initIdentity()
  effect.getParameter<Mat4>('world').rotateYawPitchRoll(time / 2000, time / 4000, time / 8000)
  effect.getParameter<Mat4>('world').setTranslation(x - (size - 1) / 2, size - y - (size + 1) / 2, -2)
  effect.getParameter<Mat4>('view').initTranslation(0, 0, -2)
  effect.getParameter<Mat4>('projection').initPerspectiveFieldOfView(Math.PI / 3, aspect, 1, 10)
  effect.parameters.time = time / 1000
  effect.draw(mesh)
}
