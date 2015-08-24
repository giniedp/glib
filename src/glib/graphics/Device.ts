module Glib.Graphics {

  export var DefaultContextAttributes = {
    // If true, requests a drawing buffer with an alpha channel for the
    // purposes of performing OpenGL destination alpha operations
    // and compositing with the page.
    alpha: true,

    // If true, requests drawing buffer with a depth buffer of at least
    // 16 bits.
    depth: true,

    // If true, requests a stencil buffer of at least 8 bits.
    stencil: false,

    // If true, requests drawing buffer with antialiasing using its choice
    // of technique (multisample/supersample) and quality.
    antialias: true,

    // If true, requests drawing buffer which contains colors with
    // premultiplied alpha. (Ignored if Alpha is false.)
    premultipliedAlpha: true,

    // If true, requests that contents of the drawing buffer remain in
    // between frames, at potential performance cost.
    preserveDrawingBuffer: false
  };

  function getGlExtensions(context, target?:any):any {
    return utils.extend(target || {}, {
      OES_texture_float: context.getExtension('OES_texture_float'),
      OES_texture_half_float: context.getExtension('OES_texture_half_float'),
      WEBGL_lose_context: context.getExtension('WEBGL_lose_context'),
      OES_standard_derivatives: context.getExtension('OES_standard_derivatives'),
      OES_vertex_array_object: context.getExtension('OES_vertex_array_object'),
      WEBGL_debug_renderer_info: context.getExtension('WEBGL_debug_renderer_info'),
      WEBGL_debug_shaders: context.getExtension('WEBGL_debug_shaders'),
      WEBGL_compressed_texture_s3tc: context.getExtension('WEBGL_compressed_texture_s3tc'),
      WEBGL_depth_texture: context.getExtension('WEBGL_depth_texture'),
      OES_element_index_uint: context.getExtension('OES_element_index_uint'),
      EXT_texture_filter_anisotropic: context.getExtension('EXT_texture_filter_anisotropic'),
      WEBGL_draw_buffers: context.getExtension('WEBGL_draw_buffers'),
      ANGLE_instanced_arrays: context.getExtension('ANGLE_instanced_arrays'),
      OES_texture_float_linear: context.getExtension('OES_texture_float_linear'),
      OES_texture_half_float_linear: context.getExtension('OES_texture_half_float_linear'),
      WEBGL_compressed_texture_atc: context.getExtension('WEBGL_compressed_texture_atc'),
      WEBGL_compressed_texture_pvrtc: context.getExtension('WEBGL_compressed_texture_pvrtc'),
      EXT_color_buffer_half_float: context.getExtension('EXT_color_buffer_half_float'),
      WEBGL_color_buffer_float: context.getExtension('WEBGL_color_buffer_float'),
      EXT_frag_depth: context.getExtension('EXT_frag_depth'),
      EXT_sRGB: context.getExtension('EXT_sRGB'),
      WEBGL_compressed_texture_etc1: context.getExtension('WEBGL_compressed_texture_etc1'),
      EXT_blend_minmax: context.getExtension('EXT_blend_minmax'),
      EXT_shader_texture_lod: context.getExtension('EXT_shader_texture_lod'),
      EXT_color_buffer_float: context.getExtension('EXT_color_buffer_float'),
      WEBGL_shared_resources: context.getExtension('WEBGL_shared_resources'),
      WEBGL_security_sensitive_resources: context.getExtension('WEBGL_security_sensitive_resources'),
      EXT_disjoint_timer_query: context.getExtension('EXT_disjoint_timer_query')
    });
  }

  function getGlCapabilities(context, target?:any):any {
    return utils.extend(target || {}, {
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: context.getParameter(context.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      MAX_FRAGMENT_UNIFORM_VECTORS: context.getParameter(context.MAX_FRAGMENT_UNIFORM_VECTORS),
      MAX_RENDERBUFFER_SIZE: context.getParameter(context.MAX_RENDERBUFFER_SIZE),
      MAX_TEXTURE_IMAGE_UNITS: context.getParameter(context.MAX_TEXTURE_IMAGE_UNITS),
      MAX_TEXTURE_SIZE: context.getParameter(context.MAX_TEXTURE_SIZE),
      MAX_VARYING_VECTORS: context.getParameter(context.MAX_VARYING_VECTORS),
      MAX_VERTEX_ATTRIBS: context.getParameter(context.MAX_VERTEX_ATTRIBS),
      MAX_VERTEX_TEXTURE_IMAGE_UNITS: context.getParameter(context.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      MAX_VERTEX_UNIFORM_VECTORS: context.getParameter(context.MAX_VERTEX_UNIFORM_VECTORS),
      MAX_VIEWPORT_DIMS: context.getParameter(context.MAX_VIEWPORT_DIMS)
    });
  }

  function getOrCreateCanvas(canvas) {
    var result = canvas;
    if (typeof result === 'string') {
      result = document.getElementById(result);
    }
    if (!result) {
      result = document.createElement('canvas');
    }
    return result;
  }

  function getOrCreateContext(canvas, options) {
    var context = options.context;
    if (typeof context === 'string') {
      context = canvas.getContext(context, options.contextAttributes || DefaultContextAttributes);
    }
    if (!context) {
      context = canvas.getContext('experimental-webgl', options.contextAttributes || DefaultContextAttributes);
    }
    return context;
  }

  export class Device {

    canvas:any;
    context:any;

    private _indexBuffer:Buffer;
    private _vertexBuffer:Buffer;
    private _program:ShaderProgram;
    private _quadIndexBuffer:Buffer;
    private _quadVertexBuffer:Buffer;

    extensions:any;
    capabilities:any;
    sampler:SamplerState[];
    cullState:CullState;
    blendState:BlendState;
    depthState:DepthState;
    offsetState:OffsetState;
    stencilState:StencilState;
    scissorState:ScissorState;
    viewportState:ViewportState;

    constructor(options:{
      canvas?: string|HTMLCanvasElement,
      context?: string|any,
      contextAttributes?: Object
    } = {}) {

      this.canvas = getOrCreateCanvas(options.canvas);
      this.context = getOrCreateContext(this.canvas, options);
      this.extensions = getGlExtensions(this.context);
      this.capabilities = getGlCapabilities(this.context);

      this.cullState = new CullState(this);
      this.cullState.commit(CullState.Default);
      this.blendState = new BlendState(this);
      this.blendState.commit(BlendState.Default);
      this.depthState = new DepthState(this);
      this.depthState.commit(DepthState.Default);
      this.offsetState = new OffsetState(this);
      this.offsetState.commit(OffsetState.Default);
      this.stencilState = new StencilState(this);
      this.stencilState.commit(StencilState.Default);
      this.scissorState = new ScissorState(this);
      this.scissorState.commit(ScissorState.Default);
      this.viewportState = new ViewportState(this);
      //this.viewportState.commit(ViewportState.Default);

      this.sampler = [];
      var max = Number(this.capabilities.MAX_TEXTURE_IMAGE_UNITS);
      while (this.sampler.length < max) {
        this.sampler.push(new SamplerState(this, this.sampler.length))
      }
    }

    /**
     * Clears the color, depth and stencil buffers
     * @param color
     * @param depth
     * @param stencil
     * @returns {Glib.Graphics.Device}
     */
    clear(color?:number|number[]|Color, depth?:number, stencil?:number):Device {
      var gl = this.context, mask = 0;

      if (color instanceof Color) {
        mask = mask | gl.COLOR_BUFFER_BIT;
        gl.clearColor(color.x, color.y, color.z, color.w);
      } else if (typeof color === 'number') {
        mask = mask | gl.COLOR_BUFFER_BIT;
        var c = Color;
        gl.clearColor(c.x(color), c.y(color), c.z(color), c.w(color));
      } else if (color !== undefined) {
        mask = mask | gl.COLOR_BUFFER_BIT;
        gl.clearColor(color[0], color[1], color[2], color[3]);
      }
      if (typeof depth === 'number') {
        mask = mask | gl.DEPTH_BUFFER_BIT;
        gl.clearDepth(depth);
      }
      if (typeof stencil === 'number') {
        mask = mask | gl.STENCIL_BUFFER_BIT;
        gl.clearStencil(stencil);
      }

      if (mask) {
        gl.clear(mask);
      }
      return this;
    }

    /**
     * Renders geometry using the current index buffer, indexing vertices of current vertex buffer.
     * @param {number} [primitiveType=TriangleList]
     * @param {number} [offset=0]
     * @param {number} [count=indexBuffer.elementCount]
     * @return {Device}
     */
    drawIndexedPrimitives(primitiveType?:number, offset?:number, count?:number):Device {
      var iBuffer = this._indexBuffer;
      if (!iBuffer) {
        utils.log("[drawIndexedPrimitives]", "indexBuffer required but nothing is set.");
        return this;
      }

      var vBuffer = this._vertexBuffer;
      if (!vBuffer) {
        utils.log("[drawIndexedPrimitives]", "vertexBuffer required but nothing is set.");
        return this;
      }

      var program = this._program;
      if (!program) {
        utils.log("[drawIndexedPrimitives]", "program required but nothing is set.");
        return this;
      }

      var type = iBuffer.dataType;
      var Enum = PrimitiveType;
      primitiveType = Enum[primitiveType || Enum.TriangleList];

      offset = offset || 0;
      count = count || (iBuffer.elementCount - offset);

      this._bindVertexLayout(vBuffer, program, vBuffer.layout, program.attributes);
      this.context.drawElements(primitiveType, count, type, offset * iBuffer.elementSize);

      return this;
    }

    /**
     * Renders multiple instances of the same geometry defined by current index buffer, indexing vertices in current vertex buffer.
     * @param {number} [instanceCount=1]
     * @param {number} [primitiveType=TriangleList]
     * @param {number} [offset=0]
     * @param {number} [count=indexBuffer.elementCount]
     * @return {Device}
     */
    drawInstancedPrimitives(instanceCount?:number, primitiveType?:number, offset?:number, count?:number):Device {
      var iBuffer = this._indexBuffer;
      if (!iBuffer) {
        utils.log("[drawInstancedPrimitives]", "indexBuffer required but nothing is set.");
        return this;
      }

      var vBuffer = this._vertexBuffer;
      if (!vBuffer) {
        utils.log("[drawInstancedPrimitives]", "vertexBuffer required but nothing is set.");
        return this;
      }

      var program = this._program;
      if (!program) {
        utils.log("[drawInstancedPrimitives]", "program required but nothing is set.");
        return this;
      }

      var type = iBuffer.dataType;
      var Enum = PrimitiveType;
      primitiveType = Enum[primitiveType || Enum.TriangleList];
      offset = offset || 0;
      count = count || (iBuffer.elementCount - offset);
      instanceCount = instanceCount || 1;

      this._bindVertexLayout(vBuffer, program, vBuffer.layout, program.attributes);
      this.context.drawElementsInstanced(primitiveType, count, type, offset * iBuffer.elementSize, instanceCount);
      return this;
    }

    /**
     * Renders geometry defined by current vertex buffer and the given primitive type.
     * @param {number} [primitiveType=TriangleList]
     * @param {number} [offset=0]
     * @param {number} [count=indexBuffer.elementCount]
     * @return {Device}
     */
    drawPrimitives(primitiveType?:number, offset?:number, count?:number):Device {
      var vBuffer = this._vertexBuffer;
      if (!vBuffer) {
        utils.log("[drawPrimitives]", "vertexBuffer required but nothing is set.");
        return this;
      }

      var program = this._program;
      if (!program) {
        utils.log("[drawPrimitives]", "program required but nothing is set.");
        return this;
      }

      primitiveType = primitiveType || PrimitiveType.TriangleList;
      offset = offset || 0;
      count = count || (vBuffer.elementCount / vBuffer.elementSize - offset);

      this._bindVertexLayout(vBuffer, program, vBuffer.layout, program.attributes);
      this.context.drawArrays(primitiveType, offset, count);
      return this;
    }

    /**
     * Draws a quad that completely covers the screen.
     * @returns {Glib.Graphics.Device}
     */
    drawQuad():Device {
      var iBuffer = this._quadIndexBuffer || this.createIndexBuffer({
          data: [0, 1, 2, 1, 2, 3],
          dataType: 'ushort'
        });
      this._quadIndexBuffer = iBuffer;

      var vBuffer = this._quadVertexBuffer || this.createVertexBuffer({
          data: [
            -1, -1, 0, 0, 1,
            1, -1, 0, 1, 1,
            -1, 1, 0, 0, 0,
            1, 1, 0, 1, 0
          ],
          layout: this.createVertexLayout('PositionTexture'),
          dataType: 'float'
        });
      this._quadVertexBuffer = vBuffer;

      this.indexBuffer = iBuffer;
      this.vertexBuffer = vBuffer;
      this.drawIndexedPrimitives();
      this.indexBuffer = null;
      this.vertexBuffer = null;
      return this;
    }

    reset():Device {
      var ext = this.context.getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext(); // trigger a context loss
        ext.restoreContext(); // restores the context
      } else {
        utils.log('[reset]', 'reset is not available due to missing extension: WEBGL_lose_context');
        // TODO:
        //this.trigger('reset');
      }
      return this;
    }

    getBackBufferData() {
      return this;
    }

    getRenderTargets() {
      return this;
    }

    setRenderTarget(target:RenderTarget) {
      if (target) {
        this.context.bindFramebuffer(this.context.FRAMEBUFFER, target.handle);
      } else {
        this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
      }
    }

    setRenderTargets(...targets:RenderTarget[]) {
      return this;
    }

    get vertexBuffer(): Buffer {
      return this._vertexBuffer;
    }
    set vertexBuffer(buffer: Buffer) {
      if (this._vertexBuffer !== buffer) {
        this.context.bindBuffer(BufferType.VertexBuffer, buffer ? buffer.handle : null);
        this._vertexBuffer = buffer;
      }
    }

    get indexBuffer(): Buffer {
      return this._indexBuffer;
    }
    set indexBuffer(buffer: Buffer) {
      if (this._indexBuffer !== buffer) {
        this.context.bindBuffer(BufferType.IndexBuffer, buffer ? buffer.handle : null);
        this._indexBuffer = buffer;
      }
    }

    get program(): ShaderProgram {
      return this._program;
    }
    set program(program: ShaderProgram) {
      if (this._program !== program) {
        this.context.useProgram(program ? program.handle : null);
        this._program = program;
      }
    }

    private _bindVertexLayout(vBuffer:Buffer, program:ShaderProgram, layout?:any, attributes?:any):Device {
      layout = layout || vBuffer.layout;
      attributes = attributes || program.attributes;

      var key, channel, attribute;
      for (key in attributes) { // jshint ignore:line
        channel = layout[key];
        attribute = attributes[key];
        if (!channel) continue;

        this.context.vertexAttribPointer(
          attribute.location,
          channel.elements,
          DataType[channel.type],
          !!attribute.normalize || !!channel.normalize,
          vBuffer.elementSize,
          channel.offset);
      }
      return this;
    }

    createIndexBuffer(options:any):Buffer {
      options.type = 'IndexBuffer';
      options.dataType = options.dataType || 'ushort';
      return new Buffer(this, options);
    }

    createVertexBuffer(options:any):Buffer {
      options.type = 'VertexBuffer';
      return new Buffer(this, options);
    }

    createProgram(options:any):ShaderProgram {
      var vSource = options.vertexShader;
      var fSource = options.fragmentShader;

      if (utils.isString(vSource) && utils.isString(fSource)) {

        if (vSource.startsWith('#') && vSource.indexOf("\n") < 0) {
          vSource = document.getElementById(vSource.substr(1)).textContent;
          options.vertexShader = vSource;
        }
        if (fSource.startsWith('#') && fSource.indexOf("\n") < 0) {
          fSource = document.getElementById(fSource.substr(1)).textContent;
          options.fragmentShader = fSource;
        }
        var inspects = Shader.inspectProgram(vSource, fSource);
        utils.extend(options, inspects);
      }
      return new ShaderProgram(this, options);
    }

    createTexture(options:TextureOptions):Texture {
      return new Texture(this, options);
    }

    createRenderTarget(options:RenderTargetOptions):RenderTarget {
      return new RenderTarget(this, options);
    }

    createTexture2D(options:TextureOptions = {}):Texture {
      options.type = TextureType.Texture2D;
      return new Texture(this, options);
    }

    createTextureCube(options:TextureOptions = {}):Texture {
      options.type = TextureType.TextureCube;
      return new Texture(this, options);
    }

    createSpriteBatch() {
      return new SpriteBatch(this);
    }

    createVertexLayout(name):any {
      return VertexLayout.create.apply(this, arguments)
    }

    createModel(options:ModelOptions):Model {
      return new Model(this, options);
    }
  }
}
