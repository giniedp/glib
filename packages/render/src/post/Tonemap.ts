import { DepthFormat, ShaderEffect, Texture } from '@gglib/graphics'
import { Manager } from '../Manager'
import { Step } from '../Types'

/**
 * @public
 */
export class Tonemap implements Step {

  public adaptSpeed: number = 0.2
  public exposure: number = 0.3
  public blackPoint: number = 0.0
  public whitePoint: number = 0.8
  public enabled: boolean = true
  public clearNext: boolean = false

  private targets: Texture[] = []
  private targetOptions = [{
    width: 512, height: 512, depthFormat: DepthFormat.None,
  }, {
    width: 128, height: 128, depthFormat: DepthFormat.None,
  }, {
    width: 32, height: 32, depthFormat: DepthFormat.None,
  }, {
    width: 8, height: 8, depthFormat: DepthFormat.None,
  }, {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }]

  private lum1: Texture
  private lum2: Texture
  private lumOptions = {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }

  constructor(private effect: ShaderEffect) {
  }

  public setup(manager: Manager) {
    // get luminance history buffers
    this.lum1 = manager.acquireTarget(this.lumOptions)
    this.lum2 = manager.acquireTarget(this.lumOptions)
  }

  public render(manager: Manager) {
    if (!this.enabled) {
      return
    }
    // TODO: implement with HdrBlendable format

    let programLuminance = this.effect.getTechnique('Luminance').pass(0).program
    let programDownsample = this.effect.getTechnique('Downsample').pass(0).program
    let programCombine = this.effect.getTechnique('Combine').pass(0).program
    let programTonemap = this.effect.getTechnique('Tonemap').pass(0).program
    let programCopy = this.effect.getTechnique('Copy').pass(0).program

    // the current backbuffer holding the rendered image
    let frontBuffer = manager.beginStep()

    // the resulting buffer
    let targetBuffer = manager.acquireTarget({
      width: frontBuffer.width,
      height: frontBuffer.height,
      depthFormat: frontBuffer.depthFormat,
    })

    // get all intermediate downsample buffers
    for (let i = 0; i < this.targetOptions.length; i++) {
      this.targets[i] = manager.acquireTarget(this.targetOptions[i])
    }

    let device = manager.device

    //
    // clear intermediate and history buffers
    //
    if (this.clearNext) {
      this.clearNext = false
      for (const target of this.targets) {
        device.setRenderTarget(target)
        device.clearColor(0)
      }
      device.setRenderTarget(this.lum1)
      device.clearColor(0)
      device.setRenderTarget(this.lum2)
      device.clearColor(0)
    }

    // -------------------------------------------------
    // [1] DETERMINE LUMINANCE
    //
    // perform luminance downscale in 5 steps until 2x2 size is reached
    for (let i = 0; i < 5; i++) {
      let program = programLuminance
      let source = frontBuffer
      if (i > 0) {
        program = programDownsample
        source = this.targets[i - 1]
      }
      program.setUniform('texture1', source)
      program.setUniform('texture1Texel', source.texel)
      device.program = program
      device.setRenderTarget(this.targets[i])
      device.drawQuad(false)
      device.setRenderTarget(null)
    }

    // combine luminance
    let thisFrameLuminance = this.targets[this.targets.length - 1]
    let lastFrameLuminance = this.lum1
    programCombine.setUniform('texture1', thisFrameLuminance)
    programCombine.setUniform('texture1Texel', thisFrameLuminance.texel)
    programCombine.setUniform('texture2', lastFrameLuminance)
    programCombine.setUniform('adaptSpeed', this.adaptSpeed)
    device.program = programCombine
    device.setRenderTarget(this.lum2)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // -------------------------------------------------
    // [2] APPLY TONEMAPPING
    //
    // maps the HDR color values to range in [0:1]

    // setup tone map effect
    programTonemap.setUniform('exposure', this.exposure)
    programTonemap.setUniform('whitePoint', this.whitePoint)
    programTonemap.setUniform('blackPoint', this.blackPoint)
    programTonemap.setUniform('texture1', frontBuffer)
    programTonemap.setUniform('texture2', this.lum2)
    device.program = programTonemap
    device.setRenderTarget(targetBuffer)
    device.drawQuad(false)
    device.setRenderTarget(null)

    //
    // DEBUG
    //

    /*
    programCopy.setUniform("texture1", this._lum1)
    device.program = programCopy
    device.setRenderTarget(targetBuffer)
    device.drawQuad(false)
    device.setRenderTarget(null)
    */

    // cleanup
    for (let i = 0; i < this.targetOptions.length; i++) {
      manager.releaseTarget(this.targets[i])
      this.targets[i] = null
    }

    // swap history frames
    let temp = this.lum2
    this.lum2 = this.lum1
    this.lum1 = temp

    // end effect with the 'targetBuffer'
    // causes the manager to release the 'frontBuffer'
    // and replace it with the given one
    manager.endStep(targetBuffer)
  }

  public cleanup(manager: Manager) {
    manager.releaseTarget(this.lum1)
    manager.releaseTarget(this.lum2)
  }
}
