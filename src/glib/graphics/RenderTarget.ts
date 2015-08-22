module Glib.Graphics {
  export interface RenderTargetOptions {
    width:number,
    height:number
  }

  export class RenderTarget {
    device:Device;
    gl:any;
    texture:Texture;
    depthBuffer:DepthBuffer;
    handle:WebGLFramebuffer;
    depthHandle:WebGLRenderbuffer;
    stencilHandle:WebGLRenderbuffer;
    width:number;
    height:number;

    constructor(device:Device, options:RenderTargetOptions) {
      this.device = device;
      this.gl = device.context;

      this.setup(options);
    }

    setup(options:RenderTargetOptions) {
      var gl = this.gl;

      this.width = options.width;
      this.height = options.height;
      this.destroy();
      this.texture = new Texture(this.device, {
        pixelFormat: PixelFormat.RGBA,
        pixelType: DataType.UNSIGNED_BYTE,
        type: TextureType.Texture2D,
        width: options.width,
        height: options.height
      });

      this.handle = this.gl.createFramebuffer();
      this.depthHandle = gl.createRenderbuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthHandle);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, options.width, options.height);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.handle, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthHandle);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    destroy():RenderTarget {
      var gl = this.gl;
      if (gl.isFramebuffer(this.handle)) {
        gl.deleteFramebuffer(this.handle);
        this.handle = null;
      }
      if (this.texture) {
        this.texture.destroy();
        this.texture = null;
      }
      if (gl.isRenderbuffer(this.depthHandle)) {
        gl.deleteRenderbuffer(this.depthHandle);
        this.depthHandle = null;
      }
      if (gl.isRenderbuffer(this.stencilHandle)) {
        gl.deleteRenderbuffer(this.stencilHandle);
        this.stencilHandle = null;
      }
      return this;
    }
  }
}
