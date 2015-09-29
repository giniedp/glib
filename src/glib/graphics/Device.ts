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

    /** The currently active index buffer */
    private _indexBuffer:Buffer;
    /** The currently active vertex buffer */
    private _vertexBuffer:Buffer;
    /** The currently active program */
    private _program:ShaderProgram;
    /** The index buffer that is used to draw a full screen quad */
    private _quadIndexBuffer:Buffer;
    /** The vertex buffer that is used to draw a full screen quad */
    private _quadVertexBuffer:Buffer;
    /** The vertex buffer that is used to draw a full screen quad with flipped texture coordinates */
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
    private _registeredRenderTargets:Texture[] = [];
    private _registeredDepthBuffers:DepthBuffer[] = [];
    private _registeredFrameBuffers: FrameBuffer[] = [];

    private _frameBuffer:FrameBuffer;
    private _customFrameBuffer:FrameBuffer;
    private _customFrameBufferOptions:FrameBufferOptions = { textures:[], depthBuffer:null };

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

    /** Gets a copy of the cull state parameters */
    get cullState() {
      return this._cullState.dump();
    }
    /** Updates the cull state parameters and direclty commits the state to the GPU */
    set cullState(v:CullStateOptions) {
      this._cullState.commit(v);
    }
    /** Gets a copy of the blend state parameters */
    get blendState() {
      return this._blendState.dump();
    }
    /** Updates the blend state parameters and direclty commits the state to the GPU */
    set blendState(v:BlendStateOptions) {
      this._blendState.commit(v);
    }
    /** Gets a copy of the depth state parameters */
    get depthState() {
      return this._depthState.dump();
    }
    /** Updates the depth state parameters and direclty commits the state to the GPU */
    set depthState(v:DepthStateOptions) {
      this._depthState.commit(v);
    }
    /** Gets a copy of the offset state parameters */
    get offsetState() {
      return this._offsetState.dump();
    }
    /** Updates the offset state parameters and direclty commits the state to the GPU */
    set offsetState(v:OffsetStateOptions) {
      this._offsetState.commit(v);
    }
    /** Gets a copy of the stencil state parameters */
    get stencilState() {
      return this._stencilState.dump();
    }
    /** Updates the stencil state parameters and direclty commits the state to the GPU */
    set stencilState(v:StencilStateOptions) {
      this._stencilState.commit(v);
    }
    /** Gets a copy of the scissor state parameters */
    get scissorState() {
      return this._scissorState.dump();
    }
    /** Updates the scissor state parameters and direclty commits the state to the GPU */
    set scissorState(v:ScissorStateOptions) {
      this._scissorState.commit(v);
    }
    /** Gets a copy of the viewport state parameters */
    get viewportState() {
      return this._viewportState.dump();
    }
    /** Updates the viewport state parameters and direclty commits the state to the GPU */
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
      if (depth != null) {
        mask = mask | gl.DEPTH_BUFFER_BIT;
        gl.clearDepth(depth);
      }
      if (stencil != null) {
        mask = mask | gl.STENCIL_BUFFER_BIT;
        gl.clearStencil(stencil);
      }

      if (mask) {
        gl.clear(mask);
      }
      return this;
    }
    /**
     * Clears the color buffer
     * @param color
     * @returns {Glib.Graphics.Device}
     */
    clearColor(color: number|number[]|Color): Device {
      var gl = this.context, mask = gl.COLOR_BUFFER_BIT;
      if (color instanceof Color) {
        gl.clearColor(color.x, color.y, color.z, color.w);
      } else if (typeof color === 'number') {
        gl.clearColor(Color.x(color), Color.y(color), Color.z(color), Color.w(color));
      } else {
        gl.clearColor(color[0], color[1], color[2], color[3]);
      }
      gl.clear(mask);
      return this;
    }
    /**
     * Clears the color and depth buffers
     * @param color
     * @returns {Glib.Graphics.Device}
     */
    clearColorDepth(color?: number|number[]|Color, depth: number = 1): Device {
      var gl = this.context, mask = gl.COLOR_BUFFER_BIT;
      if (color instanceof Color) {
        gl.clearColor(color.x, color.y, color.z, color.w);
      } else if (typeof color === 'number') {
        gl.clearColor(Color.x(color), Color.y(color), Color.z(color), Color.w(color));
      } else {
        gl.clearColor(color[0], color[1], color[2], color[3]);
      }
      gl.clear(mask);
      return this;
    }
    /**
     * Clears the depth buffer
     * @param color
     * @returns {Glib.Graphics.Device}
     */
    clearDepth(depth: number = 1): Device {
      var gl = this.context;
      gl.clearDepth(depth);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      return this;
    }
    /**
     * Clears the stencil buffer
     * @param color
     * @returns {Glib.Graphics.Device}
     */
    clearStencil(stencil: number = 0): Device {
      var gl = this.context;
      gl.clearDepth(stencil);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      return this;
    }
    /**
     * Clears the depth and stencil buffer
     * @param color
     * @returns {Glib.Graphics.Device}
     */
    clearDepthStencil(depth: number = 1, stencil: number = 0): Device {
      var gl = this.context;
      gl.clearDepth(depth);
      gl.clearDepth(stencil);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
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

    setRenderTarget(texture:Texture) {
      this.setRenderTargets(texture);
    }

    setRenderTargets(
      rt01?: Texture, rt02?: Texture, rt03?: Texture, rt04?: Texture,
      rt05?: Texture, rt06?: Texture, rt07?: Texture, rt08?: Texture,
      rt09?: Texture, rt10?: Texture, rt11?: Texture, rt12?: Texture,
      rt13?: Texture, rt14?: Texture, rt15?: Texture, rt16?: Texture) {
        var opts = this._customFrameBufferOptions;
        opts.textures.length = arguments.length;
        var firstTexture:Texture = null;
        for (var i = 0; i < arguments.length; i++) {
          opts.textures[i] = arguments[i];
          if (arguments[i] instanceof Texture) {
            firstTexture = firstTexture || arguments[i];
          }
        }
        if (firstTexture && firstTexture.depthFormat) {
          opts.depthBuffer = this.getSharedDepthBuffer(firstTexture);
        } else {
          opts.depthBuffer = null;
        }
        if (firstTexture) {
          if (!this._customFrameBuffer) {
            this._customFrameBuffer = new FrameBuffer(this, opts);
          } else {
            this._customFrameBuffer.setup(opts);
          }
          this.frameBuffer = this._customFrameBuffer;
        } else {
          this.frameBuffer = null;
        }
      return this;
    }

    get frameBuffer(): FrameBuffer {
      return this._frameBuffer;
    }
    set frameBuffer(buffer:FrameBuffer) {
      if (this._frameBuffer !== buffer) {
        var handle = buffer ? buffer.handle : null;
        this.context.bindFramebuffer(this.context.FRAMEBUFFER, handle);
        this._frameBuffer = buffer;
      }
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
      for (key in attributes) {
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

    _registerRenderTarget(texture:Texture) {
      var list = this._registeredRenderTargets;
      var index = list.indexOf(texture);
      if (index >= 0) return;
      for (var i in list) {
        if (list[i] == null) {
          list[i] = texture;
          return;
        }
      }
      list.push(texture);
    }

    _unregisterRenderTarget(texture:Texture) {
      var list = this._registeredRenderTargets;
      var index = list.indexOf(texture);
      if (index < 0) return;
      list[index] = null;
      if (list.length === (index + 1)) {
        list.length = index;
      }
    }

    _registerDepthBuffer(buffer: DepthBuffer) {
      var list = this._registeredDepthBuffers;
      var index = list.indexOf(buffer);
      if (index >= 0) return;
      for (var i in list) {
        if (list[i] == null) {
          list[i] = buffer;
          return;
        }
      }
      list.push(buffer);
    }

    _unregisterDepthBuffer(buffer: DepthBuffer) {
      var list = this._registeredDepthBuffers;
      var index = list.indexOf(buffer);
      if (index < 0) return;
      list[index] = null;
      if (list.length === (index + 1)) {
        list.length = index;
      }
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

    createRenderTarget(options:TextureOptions):Texture {
      return new Texture(this, options);
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

    getSharedDepthBuffer(options:DepthBufferOptions) {
      // no depthFormat no buffer
      if (!options.depthFormat) {
        return null;
      }
      // search by matching width, height and depthFormat
      for(var item of this._registeredDepthBuffers) {
        if (item.width === options.width && item.height === options.height && item.depthFormat === options.depthFormat) {
          return item;
        }
      }
      // create and register a new depth buffer
      var buffer = new Graphics.DepthBuffer(this, {
        width: options.width,
        height: options.height,
        depthFormat: options.depthFormat
      })
      this._registerDepthBuffer(buffer);
      return buffer;
    }
  }
}
