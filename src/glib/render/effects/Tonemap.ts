module Glib.Render.Effects {

  export class Tonemap implements Render.Step {

    adaptSpeed: number = 0.2;
    exposure: number = 0.3;
    blackPoint: number = 0.0;
    whitePoint: number = 0.8;
    enabled: boolean = true;
    clearNext: boolean = false;

    private _targets: Graphics.Texture[] = [];
    private _targetOptions = [{
      width: 512, height: 512, depthFormat: Glib.Graphics.DepthFormat.None
    },{
      width: 128, height: 128, depthFormat: Glib.Graphics.DepthFormat.None
    },{
      width: 32, height: 32, depthFormat: Glib.Graphics.DepthFormat.None
    },{
      width: 8, height: 8, depthFormat: Glib.Graphics.DepthFormat.None
    },{
      width: 2, height: 2, depthFormat: Glib.Graphics.DepthFormat.None
    }]

    private _lum1:Graphics.Texture;
    private _lum2:Graphics.Texture;
    private _lumOptions = {
      width: 2, height: 2, depthFormat: Glib.Graphics.DepthFormat.None
    }
    
    constructor(private _material:Graphics.Material) {
    }
    
    setup(manager: Render.Manager) {
      // get luminance history buffers
      this._lum1 = manager.acquireTarget(this._lumOptions)
      this._lum2 = manager.acquireTarget(this._lumOptions)
    }

    render(manager: Render.Manager) {
      if (!this.enabled) return
      // TODO: implement with HdrBlendable format 

      let programLuminance = this._material.findProgram("Luminance")
      let programDownsample = this._material.findProgram("Downsample")
      let programCombine = this._material.findProgram("Combine")
      let programTonemap = this._material.findProgram("Tonemap")
      let programCopy = this._material.findProgram("Copy")
      
      // the current backbuffer holding the rendered image
      var frontBuffer = manager.beginEffect();

      // the resulting buffer
      var targetBuffer = manager.acquireTarget({
        width: frontBuffer.width,
        height: frontBuffer.height,
        depthFormat: frontBuffer.depthFormat,
      })

      // get all intermediate downsample buffers
      for (let i = 0; i < this._targetOptions.length; i++) {
        this._targets[i] = manager.acquireTarget(this._targetOptions[i])
      }

      var device = manager.device;

      //
      // clear intermediate and history buffers
      //
      if (this.clearNext) {
        this.clearNext = false
        for (let i = 0; i < this._targets.length; i++) {
          device.setRenderTarget(this._targets[i])
          device.clearColor(0)
        }
        device.setRenderTarget(this._lum1)
        device.clearColor(0)
        device.setRenderTarget(this._lum2)
        device.clearColor(0)
      }

      //-------------------------------------------------
      // [1] DETERMINE LUMINANCE
      //
      // perform luminance downscale in 5 steps until 2x2 size is reached
      for (let i = 0; i < 5; i++) {
        let program = programLuminance
        let source = frontBuffer
        if (i > 0) {
          program = programDownsample
          source = this._targets[i-1] 
        }        
        program.setUniform("texture1", source);
        program.setUniform("texture1Texel", source.texel);
        device.program = program
        device.setRenderTarget(this._targets[i])
        device.drawQuad(false)
        device.setRenderTarget(null)
      }

      // combine luminance
      let thisFrameLuminance = this._targets[this._targets.length-1]
      let lastFrameLuminance = this._lum1 
      programCombine.setUniform("texture1", thisFrameLuminance)
      programCombine.setUniform("texture1Texel", thisFrameLuminance.texel)
      programCombine.setUniform("texture2", lastFrameLuminance)
      programCombine.setUniform("adaptSpeed", this.adaptSpeed)
      device.program = programCombine
      device.setRenderTarget(this._lum2)
      device.drawQuad(false)
      device.setRenderTarget(null)

      //-------------------------------------------------
      // [2] APPLY TONEMAPPING
      //
      // maps the HDR color values to range in [0:1]

      // setup tone map effect
      programTonemap.setUniform("exposure", this.exposure)
      programTonemap.setUniform("whitePoint", this.whitePoint)
      programTonemap.setUniform("blackPoint", this.blackPoint)
      programTonemap.setUniform("texture1", frontBuffer)
      programTonemap.setUniform("texture2", this._lum2)
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
      for (let i = 0; i < this._targetOptions.length; i++) {
        manager.releaseTarget(this._targets[i])
        this._targets[i] = null
      }

      // swap history frames
      let temp = this._lum2
      this._lum2 = this._lum1
      this._lum1 = temp

      // end effect with the 'targetBuffer'
      // causes the manager to release the 'frontBuffer' 
      // and replace it with the given one
      manager.endEffect(targetBuffer)
    }

    cleanup(manager: Render.Manager) {
      manager.releaseTarget(this._lum1)
      manager.releaseTarget(this._lum2)
    }
  }
}
