module Glib.Graphics {
  
  export interface FrameBufferOptions {
    textures?:Texture[],
    depthBuffer?:DepthBuffer  
  }
  
  export class FrameBuffer {
    device: Device;
    gl: any;
    handle: WebGLFramebuffer;
    private _colorAttachments: Texture[] = [];
    private _depthAttachment: DepthBuffer;
    private _colorAttachmentCount:number = 0;
    private _maxColorAttachments:number = 1;

    constructor(device: Device, options?:FrameBufferOptions) {
      this.device = device;
      this.gl = device.context;
      this._maxColorAttachments = device.capabilities.maxColorAttachments;
      this.setup(options);
    }

    get colorAttachmentCount():number {
      return this._colorAttachmentCount;
    }
    
    setup(options:FrameBufferOptions={}) {
      var gl = this.gl;
      
      if (!FrameBuffer.validateAttachments(options.textures, options.depthBuffer)) {
        throw "All attachments must have same width and height"
      }
      var textures = options.textures || []
      var max = Math.max(this._colorAttachments.length, textures.length);
      if (max > this._maxColorAttachments) {
        throw `Requested to attach ${max} color attachments but only ${this._maxColorAttachments} are supported.`
      }
      
      var needsRebind = false;
      // ensure framebuffer is created
      if (!this.gl.isFramebuffer(this.handle)) {
        this.handle = this.gl.createFramebuffer();
        needsRebind = true;
      }
      
      //
      // BEGIN UPDATE
      //
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.handle);
      
      // replace color attachments
      var count = 0;
      for (var i = 0; i < max; i++) {
        var oldTexture = this._colorAttachments[i];
        var newTexture = textures[i];
        // skip binding if the new texture is already bound
        if (!needsRebind && newTexture && oldTexture && newTexture.handle === oldTexture.handle) {
          count+=1;
          continue;
        }
        // bind the new texture
        if (newTexture) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, newTexture.handle, 0);
          this._colorAttachments[i] = newTexture;
          count+=1;
        }
        // unbind the old texture 
        else {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
          this._colorAttachments[i] = null; 
        }
      }
      // ensure attachment array length
      this._colorAttachments.length = textures.length;
      this._colorAttachmentCount = count;
      
      var oldBuffer = this._depthAttachment;
      var newBuffer = options.depthBuffer;
      if (oldBuffer && newBuffer && oldBuffer.handle === newBuffer.handle) {
        // skip binding if the new buffer is already bound
      } else if (newBuffer) {
        // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, newBuffer.handle);
      } else {
        // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
      }
      this._depthAttachment = newBuffer;
      
      //
      // END UPDATE
      //
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    destroy() {
      if (this.gl.isFramebuffer(this.handle)) {
        this.gl.deleteFramebuffer(this.handle);
        this.handle = null;
      }
    }
    
    static validateAttachments(textures?:Texture[], depth?:DepthBuffer) {
      // treat empty attachment list as valid
      if (!textures || textures.length === 0) {
        return true;
      }
      
      var firstTexture = null
      var width = 0;
      var height = 0;
      var depthFormat = 0;
      for(var texture of textures) {
        firstTexture = texture;
        if (texture) {
          width = texture.width;
          height = texture.height;
          depthFormat = texture.depthFormat;
          break;
        }
      }
      
      // treat empty attachment list as valid
      if (!firstTexture) {
        return true;
      }
      
      for(var texture of textures) {
        if (width !== texture.width || height !== texture.height) {
          return false;
        }
      }
      
      if (depth && (depth.width !== width || depth.height !== height || depth.depthFormat !== depthFormat)) {
        return false;
      }
      return true;
    }
  }
}
