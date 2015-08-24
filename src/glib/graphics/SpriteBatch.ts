module Glib.Graphics {

  var vShader = `
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;
    // @binding texture
    attribute vec2 texture;
    // @binding color
    // @default [1,0,0,1]
    attribute vec4 color;

    varying vec2 texCoord;
    varying vec4 texColor;

    void main(void) {
      texCoord = texture;
      texColor = color;
      gl_Position = vec4((position - vec3(1, 1, 0)) * vec3(1, -1, 1), 1);
    }`;

  var fShader = `
    precision highp float;
    precision highp int;

    // @binding texture
    // @register 0
    // @filter LinearWrap
    uniform sampler2D textureSampler;

    varying vec2 texCoord;
    varying vec4 texColor;

    void main(void) {
      gl_FragColor = texture2D(textureSampler, texCoord) * texColor;
    }`;

  var spritePool:Sprite[] = [];

  export interface SpriteBatchOptions {
    batchSize?:number
  }

  export interface SpriteBatchBeginOptions {
    sortMode?: any
    blendState?: BlendState
    cullState?: CullState
    depthState?: DepthState
    stencilState?: StencilState
    scissorState?: ScissorState
    viewportState?: ViewportState
  }

  export interface Sprite {
    texture?:Texture
    //color:number
    srcX?:number
    srcY?:number
    srcWidth?:number
    srcHeight?:number

    dstX?:number
    dstY?:number
    dstWidth?:number
    dstHeight?:number

    originX?:number
    originY?:number
    rotation?:number
    depth?:number
    color?:number
  }

  export class SpriteBatch {
    device:Graphics.Device;
    gl:any;
    private _hasBegun:boolean;
    private _spriteQueue:Sprite[];

    private _arrayBuffer:ArrayBuffer;
    private _positionTextureView:Float32Array;
    private _colorBufferView:Uint32Array;
    private _vertexBuffer:Graphics.Buffer;
    private _indexBuffer:Graphics.Buffer;
    private _program:Graphics.ShaderProgram;

    private _blendState:BlendStateOptions;
    private _oldBlendState:BlendStateOptions;
    private _cullState:CullStateOptions;
    private _oldCullState:CullStateOptions;
    private _depthState:DepthStateOptions;
    private _oldDepthState:DepthStateOptions;
    private _stencilState:StencilStateOptions;
    private _oldStencilState:StencilStateOptions;
    private _scissorState:ScissorStateOptions;
    private _oldScissorState:ScissorStateOptions;
    private _viewportState:ViewportStateOptions;
    private _oldViewportState:ViewportStateOptions;
    private _sortMode:any;
    private _batchSize:number;
    private _batchPosition:number;

    constructor(device:Graphics.Device, options:SpriteBatchOptions={}) {
      this.device = device;
      this.gl = device.context;
      this._hasBegun = false;
      this._spriteQueue = [];
      this._batchSize = options.batchSize || 512;
      this._batchPosition = 0;

      var vertexLayout = Graphics.VertexLayout.create('PositionTextureColor');
      var sizeInBytes = Graphics.VertexLayout.countBytes(vertexLayout);

      this._arrayBuffer = new ArrayBuffer(this._batchSize * 4 * sizeInBytes);
      this._positionTextureView = new Float32Array(this._arrayBuffer);
      this._colorBufferView = new Uint32Array(this._arrayBuffer);
      this._vertexBuffer = device.createVertexBuffer({
        layout: vertexLayout,
        data: this._positionTextureView,
        usage: Graphics.BufferUsage.Dynamic
      });
      this._program = device.createProgram({
        vertexShader: vShader,
        fragmentShader: fShader
      });
      var data = new Uint16Array(this._batchSize * 6);
      var index = 0;
      for (var i = 0; i < data.length; i+=6, index+=4) {
        data[i] = index;
        data[i+1] = index+1;
        data[i+2] = index+2;

        data[i+3] = index+1;
        data[i+4] = index+3;
        data[i+5] = index+2;
      }

      this._indexBuffer = device.createIndexBuffer({
        data: data
      });
    }

    begin(options?:SpriteBatchBeginOptions) {
      if (this._hasBegun) {
        throw "end() must be called before a new batch can be started with begin()";
      }
      this._sortMode = void 0;
      this._blendState = void 0;
      this._cullState = void 0;
      this._depthState = void 0;
      this._stencilState = void 0;
      this._scissorState = void 0;
      this._viewportState = void 0;
      if (options) {
        this._sortMode = options.sortMode;
        this._blendState = options.blendState;
        this._cullState = options.cullState;
        this._depthState = options.depthState;
        this._stencilState = options.stencilState;
        this._scissorState = options.scissorState;
        this._viewportState = options.viewportState;
      }
      this._hasBegun = true;
    };

    draw(options:Sprite) {
      this.drawTexture(
        options.texture,
        options.color,
        options.srcX,
        options.srcY,
        options.srcWidth,
        options.srcHeight,
        options.dstX,
        options.dstY,
        options.dstWidth,
        options.dstHeight,
        options.originX,
        options.originY,
        options.rotation,
        options.depth);
    }

    drawTexture(texture: Graphics.Texture, color, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight, originX, originY, rotation, depth) {
      if (!this._hasBegun) {
        throw "begin() must be called before draw()";
      }
      if (!texture) {
        throw "no texture given";
      }

      var sprite:Sprite = spritePool.pop() || {};

      var tW = texture.width;
      var tH = texture.height;
      var sX = srcX || 0;
      var sY = srcY || 0;
      var sW = srcWidth || (tW - sX);
      var sH = srcHeight || (tH - sY);

      sprite.srcX = sX;
      sprite.srcY = sY;
      sprite.srcWidth = sW;
      sprite.srcHeight = sH;

      sprite.dstX = dstX || 0;
      sprite.dstY = dstY || 0;
      sprite.dstWidth = dstWidth || sW;
      sprite.dstHeight = dstHeight || sH;

      sprite.texture = texture;
      sprite.depth = depth || 0;
      sprite.originX = originX || 0;
      sprite.originY = originY || 0;
      sprite.rotation = rotation || 0;
      sprite.texture = texture;
      if (color instanceof Graphics.Color) {
        sprite.color = color.rgba
      } else if (typeof color === 'number') {
        sprite.color = color
      } else {
        sprite.color = 0xFFFFFFFF;
      }

      this._spriteQueue.push(sprite);
    }

    end() {
      if (!this._hasBegun) {
        throw "begin() must be called before end()";
      }

      this._commitRenderState();
      this._draw();
      this._resetRenderState();

      for (var sprite of this._spriteQueue) {
        spritePool.push(sprite);
      }
      this._spriteQueue.length = 0;
      this._hasBegun = false;
    };

    private _commitRenderState() {
      var device = this.device;

      if (this._blendState) {
        this._oldBlendState = device.blendState.dump(this._oldBlendState);
        device.blendState.commit(this._blendState);
      }
      if (this._cullState) {
        this._oldCullState = device.cullState.dump(this._oldCullState);
        device.cullState.commit(this._cullState);
      }
      if (this._depthState) {
        this._oldDepthState = device.depthState.dump(this._oldDepthState);
        device.depthState.commit(this._depthState);
      }
      if (this._stencilState) {
        this._oldStencilState = device.stencilState.dump(this._oldStencilState);
        device.stencilState.commit(this._stencilState);
      }
      if (this._scissorState) {
        this._oldScissorState = device.scissorState.dump(this._oldScissorState);
        device.scissorState.commit(this._scissorState);
      }
      if (this._viewportState) {
        this._oldViewportState = device.viewportState.dump(this._oldViewportState);
        device.viewportState.commit(this._viewportState);
      }
    }

    private _resetRenderState(){
      var device = this.device;

      if (this._blendState) {
        device.blendState.commit(this._oldBlendState);
      }
      if (this._cullState) {
        device.cullState.commit(this._oldCullState);
      }
      if (this._depthState) {
        device.depthState.commit(this._oldDepthState);
      }
      if (this._stencilState) {
        device.stencilState.commit(this._oldStencilState);
      }
      if (this._scissorState) {
        device.scissorState.commit(this._oldScissorState);
      }
      if (this._viewportState) {
        device.viewportState.commit(this._oldViewportState);
      }
    }

    private _draw() {
      var start = 0;
      var texture = void 0;
      var queue = this._spriteQueue;

      this.device.indexBuffer = this._indexBuffer;
      this.device.vertexBuffer = this._vertexBuffer;
      this.device.program = this._program;

      for (var i = 0; i < queue.length; i++) {
        if (texture !== queue[i].texture) {
          if (i > start) {
            this.device.program.uniforms.texture.set(texture);
            this._drawSlice(start, i - start);
          }
          texture = queue[i].texture;
          start = i;
        }
      }
      this._drawSlice(start, queue.length - start);
    }

    private _drawSlice(start:number, length:number) {
      if (length == 0) {
        return;
      }

      var queue = this._spriteQueue;
      var posTexView = this._positionTextureView;
      var colorView = this._colorBufferView;

      var texture = queue[start].texture;
      var texelX = 1.0 / texture.width;
      var texelY = 1.0 / texture.height;
      var texelViewX = 1.0 / this.device.viewportState.width;
      var texelViewY = 1.0 / this.device.viewportState.height;

      var end = start + length;
      while (start < end) {
        var slice = end - start;
        slice = slice > this._batchSize ? this._batchSize : slice;

        var vIndex = 0;
        for (var i = 0; i < slice; i ++) {
          var sprite = queue[start + i];
          var cosA = 1;
          var sinA = 0;
          if (sprite.rotation !== 0) {
            cosA = Math.cos(sprite.rotation);
            sinA = Math.sin(sprite.rotation);
          }
          var cX = sprite.dstX + sprite.originX * sprite.dstWidth;
          var cY = sprite.dstY + sprite.originY * sprite.dstHeight;
          var p1X = sprite.dstX - cX;
          var p1Y = sprite.dstY - cY;
          var p2X = (sprite.dstX + sprite.dstWidth) - cX;
          var p2Y = (sprite.dstY + sprite.dstHeight) - cY;

          // VERTEX TOP LEFT

          // position
          posTexView[vIndex++] = (cX + cosA * p1X + sinA * p1Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p1X + cosA * p1Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = sprite.srcX * texelX;
          posTexView[vIndex++] = sprite.srcY * texelY;
          //color
          colorView[vIndex++] = sprite.color;

          // VERTEX TOP RIGHT

          // position
          posTexView[vIndex++] = (cX + cosA * p2X + sinA * p1Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p2X + cosA * p1Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = (sprite.srcX + sprite.srcWidth) * texelX;
          posTexView[vIndex++] = sprite.srcY * texelY;
          //color
          colorView[vIndex++] = sprite.color;

          // VERTEX BOTTOM LEFT

          // position
          posTexView[vIndex++] = (cX + cosA * p1X + sinA * p2Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p1X + cosA * p2Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = sprite.srcX * texelX;
          posTexView[vIndex++] = (sprite.srcY + sprite.srcHeight) * texelY;
          //color
          colorView[vIndex++] = sprite.color;

          // VERTEX BOTTOM RIGHT

          // position
          posTexView[vIndex++] = (cX + cosA * p2X + sinA * p2Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p2X + cosA * p2Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = (sprite.srcX + sprite.srcWidth) * texelX;
          posTexView[vIndex++] = (sprite.srcY + sprite.srcHeight) * texelY;
          //color
          colorView[vIndex++] = sprite.color;
        }

        start += slice;

        var dat:any = this._positionTextureView;
        this._vertexBuffer.setSubData(dat, 0);
        this.device.drawIndexedPrimitives(Graphics.PrimitiveType.TriangleList, 0, slice * 6);
      }
    }
  }
}
