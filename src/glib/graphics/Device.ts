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
    private _quadVertexBufferFlipped: Buffer;

    capabilities:any;
    sampler:SamplerState[];
    
    private _cullState:CullState;
    private _blendState:BlendState;
    private _depthState:DepthState;
    private _offsetState:OffsetState;
    private _stencilState:StencilState;
    private _scissorState:ScissorState;
    private _viewportState:ViewportState;
    private _vertexAttribArrayState:VertexAttribArrayState;

    constructor(options:{
      canvas?: string|HTMLCanvasElement,
      context?: string|any,
      contextAttributes?: Object
    } = {}) {

      this.canvas = getOrCreateCanvas(options.canvas);
      this.context = getOrCreateContext(this.canvas, options);
      this.capabilities = new Capabilities(this);

      this._cullState = new CullState(this);
      this.cullState = CullState.Default;
      this._blendState = new BlendState(this);
      this.blendState = BlendState.Default;
      this._depthState = new DepthState(this);
      this.depthState = DepthState.Default;
      this._offsetState = new OffsetState(this);
      this.offsetState = OffsetState.Default;
      this._stencilState = new StencilState(this);
      this.stencilState = StencilState.Default;
      this._scissorState = new ScissorState(this);
      this.scissorState = ScissorState.Default;
      this._viewportState = new ViewportState(this);
      this._vertexAttribArrayState = new VertexAttribArrayState(this);

      this.sampler = [];
      var max = Number(this.capabilities.maxTextureUnits);
      while (this.sampler.length < max) {
        this.sampler.push(new SamplerState(this, this.sampler.length))
      }
    }

    get cullState() {
      return this._cullState.dump();
    }
    set cullState(v:CullStateOptions) {
      this._cullState.commit(v);
    }
    
    get blendState() {
      return this._blendState.dump();
    }
    set blendState(v:BlendStateOptions) {
      this._blendState.commit(v);
    }
    
    get depthState() {
      return this._depthState.dump();
    }
    set depthState(v:DepthStateOptions) {
      this._depthState.commit(v);
    }
    
    get offsetState() {
      return this._offsetState.dump();
    }
    set offsetState(v:OffsetStateOptions) {
      this._offsetState.commit(v);
    }
    
    get stencilState() {
      return this._stencilState.dump();
    }
    set stencilState(v:StencilStateOptions) {
      this._stencilState.commit(v);
    }
    
    get scissorState() {
      return this._scissorState.dump();
    }
    set scissorState(v:ScissorStateOptions) {
      this._scissorState.commit(v);
    }
    
    get viewportState() {
      return this._viewportState.dump();
    }
    set viewportState(v:ViewportStateOptions) {
      this._viewportState.commit(v);
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
      var vBuffer = this._vertexBuffer;
      var program = this._program;
      if (!iBuffer) {
        throw `drawIndexedPrimitives() requires an indexBuffer`
      } 
      if (!vBuffer) {
        throw `drawIndexedPrimitives() requires a vertexBuffer`
      } 
      if (!program) {
        throw `drawIndexedPrimitives() requires a program`
      }
      
      var type = iBuffer.dataType;
      var Enum = PrimitiveType;
      primitiveType = Enum[primitiveType || Enum.TriangleList];

      offset = offset || 0;
      count = count || (iBuffer.elementCount - offset);

      this._bindAttribPointerAndLocation(vBuffer, program, vBuffer.layout, program.attributes);
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
      var vBuffer = this._vertexBuffer;
      var program = this._program;
      if (!iBuffer) {
        throw `drawInstancedPrimitives() requires an indexBuffer`
      } 
      if (!vBuffer) {
        throw `drawInstancedPrimitives() requires a vertexBuffer`
      } 
      if (!program) {
        throw `drawInstancedPrimitives() requires a program`
      }

      var type = iBuffer.dataType;
      var Enum = PrimitiveType;
      primitiveType = Enum[primitiveType || Enum.TriangleList];
      offset = offset || 0;
      count = count || (iBuffer.elementCount - offset);
      instanceCount = instanceCount || 1;

      this._bindAttribPointerAndLocation(vBuffer, program, vBuffer.layout, program.attributes);
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
      var program = this._program;
      if (!vBuffer) {
        throw `drawInstancedPrimitives() requires a vertexBuffer`
      }
      if (!program) {
        throw `drawInstancedPrimitives() requires a program`
      }

      primitiveType = primitiveType || PrimitiveType.TriangleList;
      offset = offset || 0;
      count = count || (vBuffer.elementCount / vBuffer.elementSize - offset);

      this._bindAttribPointerAndLocation(vBuffer, program, vBuffer.layout, program.attributes);
      this.context.drawArrays(primitiveType, offset, count);
      return this;
    }

    /**
     * Draws a full screen quad with the [0,0] texture coordinate starting at the bottom left.
     * @param {boolean} flipY if true, then the [0,0] texture coordinate starts in the top left.
     * @returns {Glib.Graphics.Device}
     */
    drawQuad(flipY?: boolean): Device {
      var iBuffer = this._quadIndexBuffer || this.createIndexBuffer({
          data: [0, 1, 3, 0, 3, 2],
          dataType: 'ushort'
        });
      this._quadIndexBuffer = iBuffer;

      var vBuffer;
      if (flipY) {
        vBuffer = this._quadVertexBufferFlipped || this.createVertexBuffer({
          data: [
            -1,  1, 0, 0, 0,
             1,  1, 0, 1, 0,
            -1, -1, 0, 0, 1,
             1, -1, 0, 1, 1
          ],
          layout: this.createVertexLayout('PositionTexture'),
          dataType: 'float'
        });
        this._quadVertexBufferFlipped = vBuffer;
      } else {
        vBuffer = this._quadVertexBuffer || this.createVertexBuffer({
          data: [
            -1,  1, 0, 0, 1,
             1,  1, 0, 1, 1,
            -1, -1, 0, 0, 0,
             1, -1, 0, 1, 0
          ],
          layout: this.createVertexLayout('PositionTexture'),
          dataType: 'float'
        });
        this._quadVertexBuffer = vBuffer;
      }
      
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
      
    }

    getRenderTargets() {
      
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
        var handle = program ? program.handle : null;
        this.context.useProgram(handle);
        this._program = program;
      }
    }

    private _bindAttribPointerAndLocation(vBuffer:Buffer, program:ShaderProgram, layout?:any, attributes?:any) {
      layout = layout || vBuffer.layout;
      attributes = attributes || program.attributes;

      var key, channel, attribute;
      for (key in attributes) { // jshint ignore:line
        channel = layout[key];
        attribute = attributes[key];
        if (!channel) {
          throw `Can not use current shader program with current vertex buffer. The program requires '${Object.keys(attributes)}' attributes. '${key}' is missing in vertex buffer.`
        }

        this.context.vertexAttribPointer(
          attribute.location,
          channel.elements,
          DataType[channel.type],
          !!attribute.normalize || !!channel.normalize,
          vBuffer.elementSize,
          channel.offset);
      }
      this._vertexAttribArrayState.commit(program.attributeLocations);
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
