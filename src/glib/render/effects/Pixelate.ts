module Glib.Render.Effects {

  export class Pixelate implements Render.Step {

    pixelWidth: number = 10;
    pixelHeight: number = 10;
    offset: number = 0;

    constructor(private material:Graphics.ShaderEffect) {
    }

    setup(manager: Render.Manager) {

    }

    render(manager: Render.Manager) {
      var rt = manager.beginEffect();
      var rt2 = manager.acquireTarget(rt);
      
      let program = this.material.getTechnique(0).pass(0).program
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

      manager.endEffect(rt2);
    }

    cleanup(manager: Render.Manager) {

    }
  }
}
