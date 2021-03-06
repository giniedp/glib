import { fractalProgram, brickProgram } from '@gglib/fx-procedural'
import { BlendState, CullState, DepthState, createDevice } from '@gglib/graphics'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const fbmEffect = device.createEffect({
  program: fractalProgram({
    FBM: 'fbmFractal',
    FBM_SAMPLE: 'perlinNoise3D(point.xyz)'
  }),
  parameters: {
    octaves: 8,
    frequency: 1,
    lacunarity: 2,
    persistence: 1,
    offset: 1,
    gain: 2,
    time: 0,
    normalize: false,
  }
})

const brickEffect = device.createEffect({
  program: brickProgram(),
  parameters: {
    brickWidth: 0.25,
    brickHeight: 0.08,
    mortarThickness: 0.01,
    colorMortar: [0.5, 0.5, 0.5],
    colorBrick: [0.5, 0.15, 0.14]
  }
})

loop((time, dt) => {

  device.cullState = CullState.CullNone
  device.blendState = BlendState.Default
  device.depthState = DepthState.Default
  device.resize()
  device.clear(0xff2e2620, 1)


  const effect = fbmEffect
  effect.parameters.aspect = device.drawingBufferAspectRatio
  effect.drawQuad()
})

TweakUi.mount('#tweak-ui', (ui) => {
  ui.collapsible('Fractal', () => {
    ui.slider(fbmEffect.parameters, 'octaves', { min: 1, max: 8, step: 1 })
    ui.slider(fbmEffect.parameters, 'frequency', { min: 0, max: 4 })
    ui.slider(fbmEffect.parameters, 'lacunarity', { min: 0, max: 4 })
    ui.slider(fbmEffect.parameters, 'persistence', { min: 0, max: 4 })
    ui.slider(fbmEffect.parameters, 'offset', { min: -2, max: 2 })
    ui.slider(fbmEffect.parameters, 'gain', { min: -2, max: 2 })
    ui.slider(fbmEffect.parameters, 'time', { min: 0, max: 10 })
    ui.checkbox(fbmEffect.parameters, 'normalize')
  }),
  ui.group('Brick', () => {
    ui.slider(brickEffect.parameters, 'brickWidth', { min: 0.1, max: 1 })
    ui.slider(brickEffect.parameters, 'brickHeight', { min: 0.1, max: 1 })
    ui.slider(brickEffect.parameters, 'mortarThickness', { min: 0, max: 1 })
    ui.color(brickEffect.parameters, 'colorMortar', { format: '[n]rgb' })
    ui.color(brickEffect.parameters, 'colorBrick', { format: '[n]rgb' })
  })
})
