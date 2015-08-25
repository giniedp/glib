module Glib.Render.PostEffect {

  export class Pixelate implements Step {

    private _program: Graphics.ShaderProgram;

    paramPixelWidth: number;
    paramPixelHeight: number;

    constructor(program:Graphics.ShaderProgram) {
      this._program = program;
    }

    setup(manager:Manager) {

    }

    render(manager:Manager) {
      var rt = manager.beginScreenEffect();
      var rt2 = manager.acquireRenderTarget({
        width: rt.width,
        height: rt.height,
        depth: !!rt.depthBuffer
      });
      var program = this._program;

      program.setUniform('texture', rt.texture);
      program.setUniform('pixelWidth', this.paramPixelWidth);
      program.setUniform('pixelHeight', this.paramPixelHeight);
      program.setUniform('targetWidth', rt.width);
      program.setUniform('targetHeight', rt.height);

      manager.device.program = program;
      manager.device.setRenderTarget(rt2);
      manager.device.drawQuad();
      manager.device.setRenderTarget(null);

      manager.endScreenEffect(rt2);
    }

    cleanup(manager:Manager) {

    }
  }
}
