module Glib.Render.PostEffect {

  export class Pixelate implements Render.Step {

    private _program: Graphics.ShaderProgram;

    paramPixelWidth: number = 5;
    paramPixelHeight: number = 5;

    constructor(program:Graphics.ShaderProgram) {
      this._program = program;
    }

    setup(manager: Render.Manager) {

    }

    render(manager: Render.Manager) {
      var rt = manager.beginEffect();

      var rt2 = manager.acquireTarget({
        width: rt.width,
        height: rt.height,
        depth: !!rt.depthBuffer
      });
      
      manager.device.setRenderTarget(rt2);
      
      var program = this._program;

      program.setUniform('texture', rt.texture);
      program.setUniform('pixelWidth', this.paramPixelWidth);
      program.setUniform('pixelHeight', this.paramPixelHeight);
      program.setUniform('targetWidth', rt.width);
      program.setUniform('targetHeight', rt.height);
      
      manager.device.program = program;
      
      manager.device.drawQuad();
      manager.device.setRenderTarget(null);

      manager.endEffect(rt2);
    }

    cleanup(manager: Render.Manager) {

    }
  }
}