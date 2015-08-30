module Glib.Render.Effects {

  export class ShockWave implements Render.Step {

    private _program: Graphics.ShaderProgram;

    time: number = 0;
    center: Glib.Vec2 = new Glib.Vec2(0.5, 0.5);

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
      program.setUniform('time', this.time);
      
      manager.device.program = program;
      
      manager.device.drawQuad(false);
      manager.device.setRenderTarget(null);

      manager.endEffect(rt2);
    }

    cleanup(manager: Render.Manager) {

    }
  }
}
