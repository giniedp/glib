module Glib.Graphics {
  
  export interface FrameBufferOptions {
    textures?: Texture[],
    depthBuffer?:DepthBuffer  
  }
  
  export class FrameBuffer {
    device: Device;
    gl: any;
    handle: WebGLFramebuffer;
    private _colorAttachments: Texture[] = [];
    private _depthAttachment: DepthBuffer;
    private _colorAttachmentCount: number = 0;
    private _colorAttachmentPoints: number[] = [];
    private _maxColorAttachments: number = 1;
    private _drawBuffersExtension:any;
    
    constructor(device: Device, options?:FrameBufferOptions) {
      this.device = device;
      this.gl = device.context;
      this._drawBuffersExtension = device.capabilities.extension("WEBGL_draw_buffers");
      this._maxColorAttachments = device.capabilities.maxColorAttachments;
      this.setup(options);
    }

    get colorAttachmentCount(): number {
      return this._colorAttachmentCount;
    }
    
    setup(options:FrameBufferOptions={}) {
      let gl = this.gl;
      
      if (!FrameBuffer.validateAttachments(options.textures, options.depthBuffer)) {
        throw "All attachments must have same width and height"
      }
      let textures = options.textures || []
      let targetCount = Math.max(this._colorAttachments.length, textures.length);
      if (targetCount > this._maxColorAttachments) {
        throw `Requested to attach ${targetCount} color attachments but only ${this._maxColorAttachments} are supported.`
      }
      
      let needsRebind = false;
      // ensure framebuffer is created
      if (this.handle == null || !this.gl.isFramebuffer(this.handle)) {
        this.handle = this.gl.createFramebuffer();
        needsRebind = true;
      }
      
      //
      // BEGIN UPDATE
      //
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.handle);
      
      // replace color attachments
      let count = 0;
      for (let i = 0; i < targetCount; i++) {
        let oldTexture = this._colorAttachments[i];
        let newTexture = textures[i];
        // skip binding if the new texture is already bound
        if (!needsRebind && newTexture && oldTexture && newTexture.handle === oldTexture.handle) {
          count+=1;
          continue;
        }
        // bind the new texture
        if (newTexture) {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, newTexture.handle, 0);
          this._colorAttachments[i] = newTexture;
          this._colorAttachmentPoints[i] = gl.COLOR_ATTACHMENT0 + i;
          count+=1;
        }
        // unbind the old texture 
        else {
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
          this._colorAttachments[i] = null; 
          this._colorAttachmentPoints[i] = 0;
        }
      }
      // ensure attachment array length
      this._colorAttachments.length = textures.length;
      this._colorAttachmentPoints.length = textures.length;
      this._colorAttachmentCount = count;
      if (this._drawBuffersExtension) {
        this._drawBuffersExtension.drawBuffersWEBGL(this._colorAttachmentPoints);  
      }
      
      let oldBuffer = this._depthAttachment;
      let newBuffer = options.depthBuffer;
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
      if (this.handle != null && this.gl.isFramebuffer(this.handle)) {
        this.gl.deleteFramebuffer(this.handle);
        this.handle = null;
      }
    }
    
    static validateAttachments(textures?: Texture[], depth?:DepthBuffer) {
      // treat empty attachment list as valid
      if (!textures || textures.length === 0) {
        return true;
      }
      
      let firstTexture = null
      let width = 0;
      let height = 0;
      let depthFormat = 0;
      for(let texture of textures) {
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
      
      for(let texture of textures) {
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
