module Glib.Render.Post {

  export class ShockWave implements Render.Step {

    private _program: Graphics.ShaderProgram;

    time: number = 0;
    center: Glib.Vec2 = new Glib.Vec2(0.5, 0.5);

    constructor(program:Graphics.ShaderProgram) {
      this._program = program;
    }

    render(manager: Render.Manager) {
      let rt = manager.beginStep();
      let rt2 = manager.acquireTarget(rt);
      
      manager.device.setRenderTarget(rt2);
      
      let program = this._program;

      program.setUniform('texture', rt);
      program.setUniform('time', this.time);
      
      manager.device.program = program;
      
      manager.device.drawQuad(false);
      manager.device.setRenderTarget(null);

      manager.endStep(rt2);
    }

  }
}
