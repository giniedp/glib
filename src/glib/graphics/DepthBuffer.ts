module Glib.Graphics {

  export interface DepthBufferOptions {
    width:number,
    height:number,
    handle?:WebGLRenderbuffer
  }

  export class DepthBuffer {
    device:Device;
    gl:any;
    handle:WebGLRenderbuffer;

    constructor(device, options){
      this.device = device;
      this.gl = device.context;
      this.setup(options);
    }

    setup(options) {
      if (options.handle){
        this.destroy();
        this.handle = options.handle;
      }
      if (!this.handle || !this.gl.isRenderbuffer(this.handle)) {
        this.handle = this.gl.createRenderbuffer(this.gl.RENDERBUFFER);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.handle);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, options.width, options.height);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      }
    }

    destroy(){
      if (this.gl.isRenderbuffer(this.handle)){
        this.gl.deleteRenderbuffer(this.handle);
        this.handle = null;
      }
    }
  }
}
