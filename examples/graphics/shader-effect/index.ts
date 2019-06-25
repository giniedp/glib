import {
  BlendState,
  buildCube,
  CullState,
  DepthState,
  Device,
  ModelBuilder,
  ShaderEffect,
  StencilState,
} from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// # Effect (Materials)
//
// This example demonstrates how a shader program can be reused in multiple effects.
//
// For this a `ShaderEffect` is very useful. It holds a reference to the `ShaderProgram`
// and a set of parameters. When the Before the program is used for rendering,
// all parameters are committed to that program.
//
// ---

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
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
let time = 0
loop((dt) => {
  time += dt

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
      draw(effects[y][x], x, y)
    }
  }
})

function draw(effect: ShaderEffect, x: number, y: number) {
  const aspect = device.drawingBufferAspectRatio
  effect.getParameter<Mat4>('world').initIdentity()
  effect.getParameter<Mat4>('world').rotate(time / 2000, time / 4000, time / 8000)
  effect.getParameter<Mat4>('world').setTranslationXYZ(x - (size - 1) / 2, size - y - (size + 1) / 2, -2)
  effect.getParameter<Mat4>('view').initTranslation(0, 0, -2)
  effect.getParameter<Mat4>('projection').initPerspectiveFieldOfView(Math.PI / 3, aspect, 1, 10)
  effect.draw(mesh)
}
