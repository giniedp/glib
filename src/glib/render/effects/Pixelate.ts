module Glib.Render.Effects {

  export class Pixelate implements Render.Step {

    private _program: Graphics.ShaderProgram;

    paramPixelWidth: number = 10;
    paramPixelHeight: number = 10;

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
        depth: !!rt.depthHandle
      });
      
      manager.device.setRenderTarget(rt2);
      
      var program = this._program;

      program.setUniform('texture', rt.texture);
      program.setUniform('pixelWidth', this.paramPixelWidth);
      program.setUniform('pixelHeight', this.paramPixelHeight);
      program.setUniform('targetWidth', rt.width);
      program.setUniform('targetHeight', rt.height);
      
      manager.device.program = program;
      
      manager.device.drawQuad(false);
      manager.device.setRenderTarget(null);

      manager.endEffect(rt2);
    }

    cleanup(manager: Render.Manager) {

    }
  }
}
