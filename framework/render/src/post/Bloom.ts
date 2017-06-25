import { BlendState, Color, DepthState, ShaderEffect, StencilState } from '@glib/graphics'
import { Manager } from '../Manager'
import { Step } from '../Types'

function gauss(n: number, theta: number) {
  return ((1.0 / Math.sqrt(2 * Math.PI * theta)) * Math.exp(-(n * n) / (2.0 * theta * theta)))
}

export class Bloom implements Step {
  public glowCut: number = 0.6
  public multiplier: number = 0.83
  public gaussSigma: number = 0.5
  private offsetWeights: number[][]

  constructor(private effect: ShaderEffect) {
  }

  private updateGauss(texelX: number, texelY: number) {
    let samples = 9
    let samplesOff = Math.floor(samples / 2)
    let offWeights = this.offsetWeights || []
    offWeights.length = samples
    offWeights.length = samples
    this.offsetWeights = offWeights
    for (let i = 0; i < samples; i++) {
        let data = offWeights[i]
        if (!data) {
          data = [0, 0, 0, 0]
          offWeights[i] = data
        }
        let off = (i - samplesOff)
        // Compute the offsets. We take 9 samples - 4 either side and one in the middle:
        //     i =  0,  1,  2,  3, 4,  5,  6,  7,  8
        // Offset = -4, -3, -2, -1, 0, +1, +2, +3, +4
        data[0] = off * texelX
        data[1] = off * texelY
        if (off !== 0) {
          // half pixel offset to get a sample between the pixels
          data[0] += (off > 0 ? 0.5 : -0.5) * texelX
          data[1] += (off > 0 ? 0.5 : -0.5) * texelY
        }
        // map to [-1:+1]
        let norm = off / samplesOff
        data[2] = this.multiplier * gauss(norm, this.gaussSigma)
        data[3] = this.multiplier * gauss(norm, this.gaussSigma)
    }
  }

  public render(manager: Manager) {
    let baseTarget = manager.beginStep()

    // DEBUG
    // manager.releaseTarget(rt2);
    // manager.endEffect(baseTarget);
    // return;

    let rt1 = manager.acquireTarget(baseTarget)
    let rt2 = manager.acquireTarget(baseTarget)

    this.updateGauss(1.0 / baseTarget.width, 1.0 / baseTarget.height)

    let device = manager.device
    device.depthState = DepthState.Default
    device.stencilState = StencilState.Default
    device.blendState = BlendState.Default

    // ------------------------------------------------
    // [1] GLOW CUT -> rt1
    //
    device.program = this.effect.getTechnique('glowCut').pass(0).program
    device.program.setUniform('texture', baseTarget)
    device.program.setUniform('threshold', this.glowCut)
    device.setRenderTarget(rt1)
    device.clear(0xFF000000, 1, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(rt2);
    // manager.endEffect(rt1);
    // return;

    // ------------------------------------------------
    // [2] HORIZONTAL BLUR -> rt2
    //
    // calculate filter offsets and weights
    device.program = this.effect.getTechnique('hBlur').pass(0).program
    device.program.setUniform('texture', rt1)
    for (let i = 0; i < this.offsetWeights.length; i++) {
      device.program.setUniform(`offsetWeights${i}`, this.offsetWeights[i])
    }
    device.setRenderTarget(rt2)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(rt1);
    // manager.endEffect(rt2);
    // return;

    // ------------------------------------------------
    // [2] VERTICAL BLUR -> rt1
    //
    // calculate filter offsets and weights
    device.program = this.effect.getTechnique('vBlur').pass(0).program
    device.program.setUniform('texture', rt2)
    for (let i = 0; i < this.offsetWeights.length; i++) {
      device.program.setUniform(`offsetWeights${i}`, this.offsetWeights[i])
    }
    device.setRenderTarget(rt1)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(rt2);
    // manager.endEffect(rt1);
    // return;

    // ------------------------------------------------
    // [4] COMBINE BOOM -> pongTrarget
    //
    device.program = this.effect.getTechnique('combine').pass(0).program
    device.program.setUniform('texture', baseTarget)
    device.program.setUniform('bloomTexture', rt1)

    device.setRenderTarget(rt2)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    manager.releaseTarget(rt1)
    manager.endStep(rt2)
  }
}
