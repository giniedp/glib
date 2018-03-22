import { ShaderEffect } from '@gglib/graphics'
import { Manager } from '../Manager'
import { Step } from '../Types'

/**
 * @public
 */
export class Pixelate implements Step {

  public pixelWidth: number = 10
  public pixelHeight: number = 10
  public offset: number = 0

  constructor(private effect: ShaderEffect) {
  }

  public render(manager: Manager) {
    let rt = manager.beginStep()
    let rt2 = manager.acquireTarget(rt)

    let program = this.effect.getTechnique(0).pass(0).program
    program.setUniform('texture', rt)
    program.setUniform('vOffset', this.offset)
    program.setUniform('pixelWidth', this.pixelWidth)
    program.setUniform('pixelHeight', this.pixelHeight)
    program.setUniform('targetWidth', rt.width)
    program.setUniform('targetHeight', rt.height)

    manager.device.setRenderTarget(rt2)
    manager.device.program = program
    manager.device.drawQuad(false)
    manager.device.setRenderTarget(null)

    manager.endStep(rt2)
  }
}
