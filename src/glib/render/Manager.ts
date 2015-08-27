module Glib.Render {

  export interface ICamera {
    world?: Vlib.Mat4;
    view: Vlib.Mat4;
    projection: Vlib.Mat4;
    viewProjection?: Vlib.Mat4;
  }

  export interface View {
    enabled?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    camera?: Render.ICamera;
    target?: Graphics.RenderTarget;
    steps: Render.Step[];
  }

  export class Manager {
    device:Graphics.Device;
    binder:Render.Binder;
    views: Render.View[];
    spriteBatch: Glib.Graphics.SpriteBatch;

    private _freeTargets: {target:Graphics.RenderTarget, options:Graphics.RenderTargetOptions} [] = [];
    private _usedTargets: {target:Graphics.RenderTarget, options:Graphics.RenderTargetOptions} [] = [];

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

    acquireTarget(opts: Graphics.RenderTargetOptions): Graphics.RenderTarget {
      var found;
      for (var item of this._freeTargets) {
        if (Manager._compareTargetOptions(item.options, opts)) {
          found = item;
          break;
        }
      }
      if (found) {
        // remove from free list
        var index = this._freeTargets.indexOf(found);
        this._freeTargets.splice(index, 1);
        // mark as owned and used
        this._usedTargets.push(found);
        // return
        return found.target;
      }
      var target = new Graphics.RenderTarget(this.device, opts);
      this._usedTargets.push({
        target: target,
        options: opts
      });
      return target;
    }

    releaseTarget(target: Graphics.RenderTarget) {
      var found;
      for (var item of this._usedTargets) {
        if (item.target === target) {
          found = item;
          break;
        }
      }
      if (found) {
        // remove fro used list
        var index = this._usedTargets.indexOf(found);
        this._usedTargets.splice(index, 1);
        // mark as free
        found.owner = void 0;
        this._freeTargets.push(found);
        return;
      }
      this._freeTargets.push({
        target: target,
        options: {
          width: target.width,
          height: target.height,
          depth: !!target.depthHandle
        }
      });
    }

    private static _compareTargetOptions(a:Graphics.RenderTargetOptions, b:Graphics.RenderTargetOptions):boolean {
      return (a.width === b.width) && (a.height === b.height) && (!!a.depth === !!b.depth);
    }

    private _currentView: View;
    renderView(view: Render.View) {
      for (var step of view.steps) {
        this._currentView = view;
        step.setup(this);
      }
      for (var step of view.steps) {
        this._currentView = view;
        step.render(this);
      }
      for (var step of view.steps) {
        this._currentView = view;
        step.cleanup(this);
      }
    }

    presentViews() {
      
      this.device.setRenderTarget(null);
      this.device.viewportState.commit({
        x: 0,
        y: 0,
        width: this.device.context.drawingBufferWidth,
        height: this.device.context.drawingBufferHeight
      });

      this.spriteBatch.begin();
      for (var view of this.views) {
        if (!view.enabled || !view.target) continue;
        this.spriteBatch.draw({
          texture: view.target.texture,
          dstX: view.x,
          dstY: view.y,
          dstWidth: view.width,
          dstHeight: view.height,
          flipY: true
        });
      }
      this.spriteBatch.end();
    }

    private _hasBegunEffect:boolean;
    beginEffect(){
      if (this._hasBegunEffect) {
        throw "endEffect() must be called first"
      }
      this._hasBegunEffect = true;
      var view = this._currentView;

      if (view.steps.length > 1 && !view.target) {
        view.target = this.acquireTarget({
          width: view.width,
          height: view.height,
          depth: true
        })
      }
      return view.target;
    }

    endEffect(renderTarget?:Graphics.RenderTarget){
      if (!this._hasBegunEffect) {
        throw "beginEffect() must be called first"
      }
      this._hasBegunEffect = false;
      if (!renderTarget || renderTarget === this._currentView.target) {
        return;
      }
      if (this._currentView.target) {
        this.releaseTarget(this._currentView.target);
      }
      this._currentView.target = renderTarget;
    }
  }
}
