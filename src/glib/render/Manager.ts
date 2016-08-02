module Glib.Render {

  export interface ICamera {
    world?: Glib.Mat4;
    view: Glib.Mat4;
    projection: Glib.Mat4;
    viewProjection?: Glib.Mat4;
  }

  export interface View {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    camera?: Render.ICamera;
    target?: Graphics.Texture;
    steps: Render.Step[];
  }

  export class Manager {
    device:Graphics.Device;
    binder:Render.Binder;
    views: Render.View[];
    spriteBatch: Glib.Graphics.SpriteBatch;

    private freeTargets: {target:Graphics.Texture, options:Graphics.RenderTargetOptions} [] = [];
    private usedTargets: {target:Graphics.Texture, options:Graphics.RenderTargetOptions} [] = [];

    constructor(device:Graphics.Device) {
      this.device = device;
      this.binder = new Render.Binder(device);
      this.views = [];
      this.spriteBatch = device.createSpriteBatch();  
    }

    createView(view: Render.View) {
      if (view.enabled == null) view.enabled = true;
      if (view.x == null) view.x = 0;
      if (view.y == null) view.y = 0;
      if (view.width == null) view.width = this.device.context.drawingBufferWidth - view.x;
      if (view.height == null) view.height = this.device.context.drawingBufferHeight - view.y;
      
      this.views.push(view);
    }

    deleteView(indexOrView){
      var view = this.views[indexOrView] || indexOrView;
      var index = this.views.indexOf(view);
      this.views.splice(index, 1);
      if (view.renderTarget) {
        this.releaseTarget(view.renderTarget);
      }
    }

    acquireTarget(opts: Graphics.RenderTargetOptions): Graphics.Texture {
      var found;
      for (var item of this.freeTargets) {
        if (Manager._compareTargetOptions(item.options, opts)) {
          found = item;
          break;
        }
      }
      if (found) {
        // remove from free list
        var index = this.freeTargets.indexOf(found);
        this.freeTargets.splice(index, 1);
        // mark as owned and used
        this.usedTargets.push(found);
        // return
        return found.target;
      }
      if (opts instanceof Graphics.Texture) {
        opts = {
          width: opts.width,
          height: opts.height,
          depthFormat: opts.depthFormat
        }
      }
      Glib.utils.debug("[Render.Manager]", "acquireTarget", "createTexture2D", opts)
      var target = this.device.createTexture2D(opts);
      this.usedTargets.push({
        target: target,
        options: opts
      });
      return target;
    }

    releaseTarget(target: Graphics.Texture) {
      var found;
      for (var item of this.usedTargets) {
        if (item.target === target) {
          found = item;
          break;
        }
      }
      if (found) {
        // remove from used list
        var index = this.usedTargets.indexOf(found);
        this.usedTargets.splice(index, 1);
        // mark as free
        found.owner = void 0;
        this.freeTargets.push(found);
        return;
      }
      this.freeTargets.push({
        target: target,
        options: {
          width: target.width,
          height: target.height,
          depthFormat: target.depthFormat
        }
      });
    }

    private static _compareTargetOptions(a:Graphics.RenderTargetOptions, b:Graphics.RenderTargetOptions):boolean {
      return (a.width === b.width) && (a.height === b.height) && (!!a.depthFormat === !!b.depthFormat);
    }

    private currentView: View;
    renderView(view: Render.View) {
      for (var step of view.steps) {
        this.currentView = view;
        step.setup(this);
      }
      for (var step of view.steps) {
        this.currentView = view;
        step.render(this);
      }
      for (var step of view.steps) {
        this.currentView = view;
        step.cleanup(this);
      }
    }

    presentViews() {
      this.device.setRenderTarget(null);
      this.spriteBatch.begin();
      for (var view of this.views) {
        if (!view.enabled || !view.target) continue;
        this.spriteBatch
          .draw(view.target)
          .destination(view.x, view.y, view.width, view.height)
          .flip(false, true)
      }
      this.spriteBatch.end();
    }

    private effectHasBegun:boolean;
    beginEffect(){
      if (this.effectHasBegun) {
        throw "endEffect() must be called first"
      }
      this.effectHasBegun = true;
      var view = this.currentView;

      if (view.steps.length > 1 && !view.target) {
        view.target = this.acquireTarget({
          width: view.width,
          height: view.height,
          depthFormat: Glib.Graphics.DepthFormat.DepthStencil
        })
      }
      return view.target;
    }

    endEffect(renderTarget?:Graphics.Texture){
      if (!this.effectHasBegun) {
        throw "beginEffect() must be called first"
      }
      this.effectHasBegun = false;
      if (!renderTarget || renderTarget === this.currentView.target) {
        return;
      }
      if (this.currentView.target) {
        this.releaseTarget(this.currentView.target);
      }
      this.currentView.target = renderTarget;
    }
  }
}
