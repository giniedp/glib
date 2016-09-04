module Glib.Render.Post {

  export class Pixelate implements Render.Step {

    pixelWidth: number = 10;
    pixelHeight: number = 10;
    offset: number = 0;

    constructor(private effect:Graphics.ShaderEffect) {
    }

    render(manager: Render.Manager) {
      var rt = manager.beginStep();
      var rt2 = manager.acquireTarget(rt);
      
      let program = this.effect.getTechnique(0).pass(0).program
      program.setUniform('texture', rt);
      program.setUniform('vOffset', this.offset);
      program.setUniform('pixelWidth', this.pixelWidth);
      program.setUniform('pixelHeight', this.pixelHeight);
      program.setUniform('targetWidth', rt.width);
      program.setUniform('targetHeight', rt.height);
      
      manager.device.setRenderTarget(rt2);
      manager.device.program = program;
      manager.device.drawQuad(false);
      manager.device.setRenderTarget(null);

      manager.endStep(rt2);
    }

  }
}
