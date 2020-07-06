import {
  BlendState,
  buildCube,
  CullState,
  DepthState,
  DeviceGL,
  ModelBuilder,
  ShaderEffect,
  StencilState,
} from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new DeviceGL({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the mesh that should be rendered
const mesh = ModelBuilder.begin().tap(buildCube).endMesh(device)

// Create several effects.
// All effects share the same shader program. But each has its own set of parameters.
let size = 5
let effects: ShaderEffect[][] = []
for (let y = 0; y < size; y++) {
  effects[y] = effects[y] || []
  for (let x = 0; x < size; x++) {
    effects[y][x] = device.createEffect({
      program: program,
      parameters: {
        world: Mat4.createIdentity(),
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
        specularPower: (x + y * size) / (size * size),
        diffuseColor: [Math.random(), Math.random(), Math.random()],
        lightColor: [Math.random(), Math.random(), Math.random()],
      },
    })
  }
}

// Begin the rendering loop
loop((time, dt) => {

  // Resize and clear the screen
  device.resize()
  device.clear(0xff2e2620, 1)
  device.cullState = CullState.CullNone
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.stencilState = StencilState.Default

  // Render the mesh for each effect.
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
  effect.draw(mesh)
}
