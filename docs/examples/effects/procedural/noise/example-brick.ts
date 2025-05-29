import { brickProgram } from '@gglib/effects'
import { createDevice, Material } from '@gglib/graphics'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const effect = new Material(device,{
    program: brickProgram(),
    parameters: {
      brickWidth: 0.25,
      brickHeight: 0.08,
      mortarThickness: 0.01,
      colorMortar: [0.5, 0.5, 0.5],
      colorBrick: [0.5, 0.15, 0.14],
    },
  })

  function frame() {
    device.resize()
    device.clear(0xff2e2620, 1)

    effect.parameters.aspect = device.drawingBufferAspectRatio
    effect.drawQuad()
  }

  TweakUi.mount(tools, (ui) => {
    ui.slider(effect.parameters, 'brickWidth', { min: 0.1, max: 1 })
    ui.slider(effect.parameters, 'brickHeight', { min: 0.1, max: 1 })
    ui.slider(effect.parameters, 'mortarThickness', { min: 0, max: 1 })
    ui.color(effect.parameters, 'colorMortar', { format: '[n]rgb' })
    ui.color(effect.parameters, 'colorBrick', { format: '[n]rgb' })
  })

  return loop(frame).stop
}
