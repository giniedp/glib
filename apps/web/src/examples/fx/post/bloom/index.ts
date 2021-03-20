import {
  BlendState,
  CullState,
  DepthState,
  createDevice,
  ModelBuilder,
  ShaderEffect,
  buildIcosahedron,
} from '@gglib/graphics'
import { loop } from '@gglib/utils'
import { materialProgram } from '@gglib/fx-materials'
import { PostBloomEffect } from '@gglib/fx-post'
import { Mat4 } from '@gglib/math'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const effect = device.createEffect({
  program: materialProgram({
    DIFFUSE_COLOR: true,
    V_NORMAL: true,
  }),
})

let size = 5
let effects: ShaderEffect[][] = []
for (let y = 0; y < size; y++) {
  effects[y] = effects[y] || []
  for (let x = 0; x < size; x++) {
    effects[y][x] = device.createEffect({
      techniques: effect.techniques,
      parameters: {
        World: Mat4.createIdentity(),
        View: Mat4.createIdentity(),
        Projection: Mat4.createIdentity(),
        DiffuseColor: [Math.random(), Math.random(), Math.random()],
      },
    })
  }
}

const mesh = ModelBuilder.begin().append(buildIcosahedron).endMeshPart(device)
const bloom = new PostBloomEffect(device, {
  gaussSigma: 1.5,
  glowCut: 0.5,
  iterations: 2,
  multiplier: 0.5,
})

const rt1 = device.createRenderTarget({ width: device.drawingBufferWidth, height: device.drawingBufferHeight })
const rt2 = device.createRenderTarget({ width: device.drawingBufferWidth, height: device.drawingBufferHeight })
const rt3 = device.createRenderTarget({ width: device.drawingBufferWidth, height: device.drawingBufferHeight })

loop((time, dt) => {
  device.resize()
  rt1.resize(device.drawingBufferWidth, device.drawingBufferHeight)
  rt2.resize(device.drawingBufferWidth, device.drawingBufferHeight)
  rt3.resize(device.drawingBufferWidth, device.drawingBufferHeight)

  device.cullState = CullState.Default
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.setRenderTarget(rt1)
  device.clear(0xff2e2620, 1.0)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      draw(time, effects[y][x], x, y)
    }
  }
  device.setRenderTarget(null)

  bloom.input = rt1
  bloom.intermediate1 = rt2
  bloom.intermediate2 = rt3
  bloom.draw()
})

function draw(time: number, effect: ShaderEffect, x: number, y: number) {
  const aspect = device.drawingBufferAspectRatio
  effect.getParameter<Mat4>('World').initIdentity()
  effect.getParameter<Mat4>('World').rotateYawPitchRoll(time / 2000, time / 4000, time / 8000)
  effect.getParameter<Mat4>('World').setTranslation(x - (size - 1) / 2, size - y - (size + 1) / 2, -2)
  effect.getParameter<Mat4>('View').initTranslation(0, 0, -2)
  effect.getParameter<Mat4>('Projection').initPerspectiveFieldOfView(Math.PI / 3, aspect, 1, 10)
  effect.parameters.time = time / 1000
  effect.draw(mesh)
}

TweakUi.mount('#tweak-ui', (ui) => {
  ui.collapsible('Bloom', () => {
    ui.slider(bloom, 'glowCut', { min: 0, max: 1 })
    ui.slider(bloom, 'multiplier', { min: 0, max: 1 })
    ui.slider(bloom, 'gaussSigma', { min: 1, max: 3 })
    ui.slider(bloom, 'iterations', { min: 1, max: 20, step: 1 })
  })
})
