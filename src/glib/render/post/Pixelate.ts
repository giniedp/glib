module Glib.Render.PostEffect {


  export class Pixelate implements Step {

    setup(manager:Manager) {

    }

    render(manager:Manager) {
      var rt = manager.beginScreenEffect();
      var rt2 = manager.acquireRenderTarget({
        width: rt.width,
        height: rt.height,
        depth: !!rt.depthBuffer
      });



      manager.endScreenEffect(rt2);
    }

    cleanup(manager:Manager) {

    }
  }
}
