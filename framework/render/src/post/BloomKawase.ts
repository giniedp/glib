// tslint:disable no-bitwise
import { BlendState, Color, DepthFormat, DepthState, ShaderEffect, ShaderProgram, StencilState } from '@glib/graphics'
import { Manager } from '../Manager'
import { Step } from '../Types'

export class BloomKawase implements Step {
  public glowCut: number = 0.6
  public iterations: number = 5
  public halfSize: boolean = true
  private targetOptions = {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }

  constructor(private effect: ShaderEffect) {
  }

  public render(manager: Manager) {
    let baseTarget = manager.beginStep()

    if (this.halfSize) {
      this.targetOptions.width = (baseTarget.width / 2) | 0
      this.targetOptions.height = (baseTarget.height / 2) | 0
    } else {
      this.targetOptions.width = baseTarget.width
      this.targetOptions.height = baseTarget.height
    }

    let resultTarget = manager.acquireTarget(baseTarget)
    let renderTarget1 = manager.acquireTarget(this.targetOptions)
    let renderTarget2 = manager.acquireTarget(this.targetOptions)
    let texel = renderTarget1.texel

    let device = manager.device
    let program: ShaderProgram

    // ------------------------------------------------
    // GLOW CUT
    //

    program = this.effect.getTechnique('glowCut').pass(0).program
    program.setUniform('threshold', this.glowCut)
    program.setUniform('texture1', baseTarget)
    device.program = program
    device.blendState = BlendState.Default
    device.setRenderTarget(renderTarget1)
    device.drawQuad()
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(renderTarget2);
    // manager.releaseTarget(resultTarget);
    // manager.endEffect(renderTarget1);
    // return;

    // ------------------------------------------------
    // KAWASE ITERATIONS
    //
    program = this.effect.getTechnique('kawaseIteration').pass(0).program
    device.blendState = BlendState.Default
    for (let i = 0; i < this.iterations; i++) {
      program.setUniform('iteration', i + 1)
      program.setUniform('texture1', renderTarget1)
      program.setUniform('texel', texel)
      device.program = program
      device.blendState = BlendState.Default
      device.setRenderTarget(renderTarget2)
      device.drawQuad()
      device.setRenderTarget(null)
      let temp = renderTarget1
      renderTarget1 = renderTarget2
      renderTarget2 = temp
    }

    // DEBUG
    // manager.releaseTarget(renderTarget2);
    // manager.releaseTarget(resultTarget);
    // manager.endEffect(renderTarget1);
    // return;

    // ------------------------------------------------
    // COMBINE
    //
    program = this.effect.getTechnique('combine').pass(0).program
    program.setUniform('texture1', baseTarget)
    program.setUniform('texture2', renderTarget1)
    device.program = program
    device.blendState = BlendState.Default
    device.setRenderTarget(resultTarget)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // FINISH
    manager.releaseTarget(renderTarget1)
    manager.releaseTarget(renderTarget2)
    manager.endStep(resultTarget)
  }

}
