module Glib.Render.Effects {

  function gauss(n:number, theta:number) {
    return ((1.0 / Math.sqrt(2 * Math.PI * theta)) * Math.exp(-(n * n) / (2.0 * theta * theta)));
  }
      
  export class Bloom implements Render.Step {

    private _material: Graphics.Material;
    
    glowCut: number = 0.6;
    multiplier: number = 0.83;
    gaussSigma: number = 0.5;
    private _offsetWeights: Array<Array<number>>;
    
    constructor(material:Graphics.Material) {
      this._material = material;
    }

    private _updateGauss(texelX, texelY){
      var samples = 9;
      var samplesOff = Math.floor(samples / 2);
      var offWeights = this._offsetWeights || [];
      offWeights.length = samples;
      offWeights.length = samples;
      this._offsetWeights = offWeights;
      for (var i = 0; i < samples; i++) {
          var data = offWeights[i];
          if (!data) {
            data = [0, 0, 0, 0];
            offWeights[i] = data
          }
          var off = (i - samplesOff);
          // Compute the offsets. We take 9 samples - 4 either side and one in the middle:
          //     i =  0,  1,  2,  3, 4,  5,  6,  7,  8
          //Offset = -4, -3, -2, -1, 0, +1, +2, +3, +4
          data[0] = off * texelX;
          data[1] = off * texelY;
          if (off != 0) {
            // half pixel offset to get a sample between the pixels
            data[0] += (off > 0 ? 0.5 : -0.5) * texelX;
            data[1] += (off > 0 ? 0.5 : -0.5) * texelY;
          }
          // map to [-1:+1]
          var norm = off / samplesOff;
          data[2] = this.multiplier * gauss(norm, this.gaussSigma);
          data[3] = this.multiplier * gauss(norm, this.gaussSigma);
      }
    } 
    
    setup(manager: Render.Manager) {

    }

    render(manager: Render.Manager) {
      var baseTarget = manager.beginEffect();
      
      // DEBUG
      //manager.releaseTarget(pongTarget);
      //manager.endEffect(baseTarget);
      //return;
      
      var pingTarget = manager.acquireTarget({
        width: baseTarget.width,
        height: baseTarget.height,
        depth: !!baseTarget.depthHandle
      });
      
      var pongTarget = manager.acquireTarget({
        width: baseTarget.width,
        height: baseTarget.height,
        depth: !!baseTarget.depthHandle
      });
      
      this._updateGauss(1.0 / baseTarget.width, 1.0 / baseTarget.height);

      var device = manager.device;
      device.depthState = Graphics.DepthState.Default;
      device.stencilState = Graphics.StencilState.Default;
      device.blendState = Graphics.BlendState.Default;
      
      //-------------------------------------------------
      // [1] GLOW CUT -> pingTarget
      //
      device.program = this._material.findProgram("glowCut");
      device.program.setUniform("texture", baseTarget);
      device.program.setUniform("threshold", this.glowCut);
      device.setRenderTarget(pingTarget);
      device.clear(0xFF000000, 1, 1);
      device.drawQuad(false);
      device.setRenderTarget(null);

      // DEBUG
      //manager.releaseTarget(pongTarget);
      //manager.endEffect(pingTarget);
      //return;
      
      //-------------------------------------------------
      // [2] HORIZONTAL BLUR -> pongTarget
      //
      // calculate filter offsets and weights
      device.program = this._material.findProgram("hBlur");
      device.program.setUniform("texture", pingTarget);
      for (var i = 0; i < this._offsetWeights.length; i++) {
        device.program.setUniform(`offsetWeights[${i}]`, this._offsetWeights[i]);
      }
      device.setRenderTarget(pongTarget);
      device.clear(Graphics.Color.TransparentBlack, 1);
      device.drawQuad(false);
      device.setRenderTarget(null);
      
      // DEBUG
      //manager.releaseTarget(pingTarget);
      //manager.endEffect(pongTarget);
      //return;
      
      //-------------------------------------------------
      // [2] VERTICAL BLUR -> pingTarget
      //
      // calculate filter offsets and weights
      device.program = this._material.findProgram("vBlur");
      device.program.setUniform("texture", pongTarget);
      for (var i = 0; i < this._offsetWeights.length; i++) {
        device.program.setUniform(`offsetWeights[${i}]`, this._offsetWeights[i]);
      }
      device.setRenderTarget(pingTarget);
      device.clear(Graphics.Color.TransparentBlack, 1);
      device.drawQuad(false);
      device.setRenderTarget(null);
      
      // DEBUG
      //manager.releaseTarget(pongTarget);
      //manager.endEffect(pingTarget);
      //return;
      
      //-------------------------------------------------
      // [4] COMBINE BOOM -> pongTrarget
      //
      device.program = this._material.findProgram("combine");
      device.program.setUniform("texture", baseTarget);
      device.program.setUniform("bloomTexture", pingTarget);
      
      device.setRenderTarget(pongTarget);
      device.clear(Graphics.Color.TransparentBlack, 1);
      device.drawQuad(false);
      device.setRenderTarget(null);
      
      manager.releaseTarget(pingTarget);
      manager.endEffect(pongTarget);
    }

    cleanup(manager: Render.Manager) {

    }
  }
}
