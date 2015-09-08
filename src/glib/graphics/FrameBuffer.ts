module Glib.Graphics {
  
  export interface FrameBufferOptions {
    width:number,
    height:number,
    depthFormat?:number
  }
  
  export class FrameBuffer {
    device:Device;
    gl:any;
    texture:Texture;
    handle:WebGLFramebuffer;
    depthHandle:WebGLRenderbuffer;
    stencilHandle:WebGLRenderbuffer;
    width:number;
    height:number;
    depthFormat:number;
    
    constructor() {
      
    }
  }
}