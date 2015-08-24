module Glib.Render {

  export interface Screen {
    x?:number;
    y?:number;
    width?:number;
    height?:number;
    renderTarget?:Graphics.RenderTarget;
    steps:Step[];
  }

  export class Manager {
    device:Glib.Graphics.Device;
    context:any;
    binder:Glib.Render.Binder;
    screens:Screen[];

    private _freeTargets: {target:RenderTarget, options:Graphics.RenderTargetOptions} [] = [];
    private _usedTargets: {target:RenderTarget, options:Graphics.RenderTargetOptions} [] = [];

    constructor(device:Graphics.Device) {
      this.device = device;
      this.context = device.context;
      this.binder = new Render.Binder(device);
      this.screens = [];
    }

    createScreen(screen:Screen){
      screen.x = 0;
      screen.y = 0;
      screen.width = this.device.context.drawingBufferWidth;
      screen.height = this.device.context.drawingBufferHeight;
      if (screen.steps.length > 1 && !screen.renderTarget) {
        screen.renderTarget = this.acquireRenderTarget({
          width: screen.width,
          height: screen.height,
          depth: true
        })
      }
    }

    deleteScreen(screenOrIndex){
      var screen = this.screens[screenOrIndex] || screenOrIndex;
      var index = this.screens.indexOf(screen);
      this.screens.splice(index, 1);
      if (screen.renderTarget) {
        this.releaseRenderTarget(screen.renderTarget);
      }
    }

    acquireRenderTarget(opts:Graphics.RenderTargetOptions):RenderTarget {
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

    releaseRenderTarget(target:RenderTarget) {
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

    private _screen:Screen;
    renderScreen(screen){
      var step:Step = null, steps = screen.steps;
      for (step of steps) {
        this._screen = screen;
        step.setup(this);
      }
      for (step of steps) {
        this._screen = screen;
        step.render(this);
      }
      for (step of steps) {
        this._screen = screen;
        step.cleanup(this);
      }
    }

    private _hasBegunEffect:boolean;
    beginScreenEffect(){
      if (this._hasBegunEffect) {
        throw "endScreenEffect() must be called first"
      }
      this._hasBegunEffect = true;
      return this._screen.renderTarget;
    }

    endScreenEffect(renderTarget?:Graphics.RenderTarget){
      if (!this._hasBegunEffect) {
        throw "beginScreenEffect() must be called first"
      }
      this._hasBegunEffect = false;
      if (!renderTarget || renderTarget === this._screen.renderTarget) {
        return;
      }
      if (this._screen.renderTarget) {
        this.releaseRenderTarget(this._screen.renderTarget);
      }
      this._screen.renderTarget = renderTarget;
    }
  }
}
