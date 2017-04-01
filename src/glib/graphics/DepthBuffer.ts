module Glib.Graphics {

  /**
   * Options to be used to create a new DepthBuffer
   */
  export interface DepthBufferOptions {
    /**
     * The width of the depth buffer surface
     */
    width: number,
    /**
     * The height of the depth buffer surface
     */
    height: number,
    /**
     * The depth and stencil format
     */
    depthFormat?: number,
    /**
     * The existing
     */
    handle?:WebGLRenderbuffer
  }

  /**
  * Describes a depth buffer object
  */
  export class DepthBuffer {
    /**
     * The graphics device
     */
    device:Device;
    /**
     * The WebGL context
     */
    gl:any;
    /**
     * The wrapped WebGLRenderbuffer object
     */
    handle:WebGLRenderbuffer;
    /**
     * The width of the surface in pixels
     */
    width: number;
    /**
     * The height of the surface in pixels
     */
    height: number;
    /**
     * The used surface format
     */
    depthFormat: number;

    /**
    * Initializes a new instance
    * @param device The graphics device
    * @param options The setup options to initialize the instance
    */
    constructor(device, options){
      this.device = device;
      this.gl = device.context;
      this.setup(options);
    }

    /**
     * Returns the WebGl constant name of the currently used depth format
     */
    get depthFormatName():string {
      return Glib.Graphics.DepthFormatName[this.depthFormat];
    }
    
    /**
     * Re-initializes the instance
     * @param options The setup options to initialize the instance
     */
    setup(options):DepthBuffer {
      let width = options.width;
      let height = options.height;
      let format = options.depthFormat;
      
      if (width == null) width = this.width;
      if (height == null) height = this.height;
      if (format == null) format = this.depthFormat;
      
      if (width == null) throw "missing width option";
      if (height == null) throw "missing height option";
      if (format == null) format = DepthFormat.DepthStencil;

      let handle = options.handle;
      
      if ((handle && (handle !== this.handle)) || this.width !== width || this.height !== height || this.depthFormat !== format){
        this.destroy();
        this.handle = handle;
      }
      this.device.registerDepthBuffer(this);

      if (!this.handle || !this.gl.isRenderbuffer(this.handle)) {
        this.handle = this.gl.createRenderbuffer(this.gl.RENDERBUFFER);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.handle);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, format, width, height);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      }
      
      this.width = width;
      this.height = height;
      this.depthFormat = format;
      
      return this;
    }

    /**
     * Deletes the wrapped WebGLRenderbuffer
     */
    destroy(){
      this.device.unregisterDepthBuffer(this);
      if (this.gl.isRenderbuffer(this.handle)){
        this.gl.deleteRenderbuffer(this.handle);
        this.handle = null;
      }
    }
  }
}
