module Glib.Graphics {

  var vShader = `
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 vPosition;
    // @binding texture
    attribute vec2 vTexture;
    // @binding color
    // @default [1,0,0,1]
    attribute vec4 vColor;

    varying vec2 texCoord;
    varying vec4 texColor;

    void main(void) {
      texColor = vColor;
      texCoord = vTexture;
      vec2 pos = vPosition.xy * vec2(2, -2) + vec2(-1, 1);
      gl_Position = vec4(pos.xy, vPosition.z, 1);
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
    color?:number|Color

    srcX?:number
    srcY?:number
    srcWidth?:number
    srcHeight?:number

    dstX?:number
    dstY?:number
    dstWidth?:number
    dstHeight?:number

    rotation?:number
    originX?:number
    originY?:number
    
    depth?:number
    flipX?:boolean
    flipY?: boolean
  }

  export class SpriteBuilder {
    private sprite: Sprite

    setup(sprite) {
      this.sprite = sprite
      sprite.color = 0xFFFFFFFF

      sprite.srcX = 0
      sprite.srcY = 0
      sprite.srcWidth = 0
      sprite.srcHeight = 0

      sprite.dstX = 0
      sprite.dstY = 0
      sprite.dstWidth = 0
      sprite.dstHeight = 0

      sprite.originX = 0
      sprite.originY = 0
      sprite.rotation = 0
      sprite.depth = 0
      sprite.flipX = false
      sprite.flipY = false
    }
    color(color:number|Color):SpriteBuilder {
      this.sprite.color = color
      return this
    }
    alpha(alpha:number):SpriteBuilder {
      var color = this.sprite.color as number
      if (color == void 0) color = 0xFFFFFFFF
      this.sprite.color = (color & 0x00FFFFFF) | (((alpha * 255) & 0xFF) << 24)
      return this
    }
    source(x:number, y:number, width?:number, height?:number): SpriteBuilder {
      let s = this.sprite
      s.srcX = x
      s.srcY = y
      s.srcWidth = width
      s.srcHeight = height
      return this
    }
    sourceVec(vec:IVec2) {
      let s = this.sprite
      s.srcX = vec.x
      s.srcY = vec.y
      return this
    }
    sourceRect(rect:IRect) {
      return this.source(rect.x, rect.y, rect.width, rect.height)
    }
    destination(x:number, y:number, width?:number, height?:number): SpriteBuilder {
      let s = this.sprite
      s.dstX = x
      s.dstY = y
      s.dstWidth = width
      s.dstHeight = height
      return this
    }
    destinationVec(vec:IVec2) {
      let s = this.sprite
      s.dstX = vec.x
      s.dstY = vec.y
      return this
    }
    destinationRect(rect:IRect) {
      return this.destination(rect.x, rect.y, rect.width, rect.height)
    }
    origin(x:number, y:number): SpriteBuilder {
      let s = this.sprite
      s.originX = x
      s.originY = y
      return this
    }
    rotation(rotation:number):SpriteBuilder {
      this.sprite.rotation = rotation
      return this
    }
    depth(depth:number):SpriteBuilder {
      this.sprite.depth = depth
      return this
    }

    flip(x:boolean, y:boolean):SpriteBuilder {
      let s = this.sprite
      s.flipX = x
      s.flipY = y
      return this  
    }
  }

  export class SpriteBatch {
    device:Graphics.Device
    gl:any
    private hasBegun:boolean
    private spriteQueue:Sprite[]

    private arrayBuffer:ArrayBuffer
    private positionTextureView:Float32Array
    private colorBufferView:Uint32Array
    private vertexBuffer:Graphics.Buffer
    private indexBuffer:Graphics.Buffer
    private program:Graphics.ShaderProgram

    private blendState:BlendStateOptions
    private cullState:CullStateOptions
    private depthState:DepthStateOptions
    private stencilState:StencilStateOptions
    private scissorState:ScissorStateOptions
    private viewportState:ViewportStateOptions
    private sortMode:any
    private batchSize:number
    private batchPosition:number
    private builder:SpriteBuilder = new SpriteBuilder()

    constructor(device:Graphics.Device, options:SpriteBatchOptions={}) {
      this.device = device;
      this.gl = device.context;
      this.hasBegun = false;
      this.spriteQueue = [];
      this.batchSize = options.batchSize || 512;
      this.batchPosition = 0;

      var vertexLayout = Graphics.VertexLayout.create('PositionTextureColor');
      var sizeInBytes = Graphics.VertexLayout.countBytes(vertexLayout);

      this.arrayBuffer = new ArrayBuffer(this.batchSize * 4 * sizeInBytes);
      this.positionTextureView = new Float32Array(this.arrayBuffer);
      this.colorBufferView = new Uint32Array(this.arrayBuffer);
      this.vertexBuffer = device.createVertexBuffer({
        layout: vertexLayout,
        data: this.positionTextureView,
        usage: Graphics.BufferUsage.Dynamic
      });
      this.program = device.createProgram({
        vertexShader: vShader,
        fragmentShader: fShader
      });
      var data = new Uint16Array(this.batchSize * 6);
      var index = 0;
      for (var i = 0; i < data.length; i+=6, index+=4) {
        data[i] = index;
        data[i+1] = index+1;
        data[i+2] = index+3;

        data[i+3] = index;
        data[i+4] = index+3;
        data[i+5] = index+2;
      }

      this.indexBuffer = device.createIndexBuffer({
        data: data
      });
    }

    begin(options?:SpriteBatchBeginOptions) {
      if (this.hasBegun) {
        throw "end() must be called before a new batch can be started with begin()";
      }
      this.sortMode = void 0;
      this.blendState = void 0;
      this.cullState = void 0;
      this.depthState = void 0;
      this.stencilState = void 0;
      this.scissorState = void 0;
      this.viewportState = void 0;
      if (options) {
        this.sortMode = options.sortMode;
        this.blendState = options.blendState;
        this.cullState = options.cullState;
        this.depthState = options.depthState;
        this.stencilState = options.stencilState;
        this.scissorState = options.scissorState;
        this.viewportState = options.viewportState;
      }
      this.hasBegun = true;
    };

    /**
     * @param texture The texture to draw
     */
    draw(texture: Graphics.Texture):SpriteBuilder {

      if (!this.hasBegun) {
        throw "begin() must be called before draw()";
      }
      if (!texture) {
        throw "no texture given";
      }

      let sprite = spritePool.pop() || {}
      sprite.texture = texture
      let builder = this.builder
      builder.setup(sprite)
      this.spriteQueue.push(sprite)
      return builder  
    }

    end() {
      if (!this.hasBegun) {
        throw "begin() must be called before end()";
      }

      this.commitRenderState();
      this.drawBatch();

      for (var sprite of this.spriteQueue) {
        spritePool.push(sprite);
      }
      this.spriteQueue.length = 0;
      this.hasBegun = false;
    };

    private commitRenderState() {
      var device = this.device;

      if (this.blendState) {
        device.blendState = this.blendState;
      }
      if (this.cullState) {
        device.cullState = this.cullState;
      }
      if (this.depthState) {
        device.depthState = this.depthState;
      }
      if (this.stencilState) {
        device.stencilState = this.stencilState;
      }
      if (this.scissorState) {
        device.scissorState = this.scissorState;
      }
      if (this.viewportState) {
        device.viewportState = this.viewportState;
      }
    }

    private buildSprites() {
      var queue = this.spriteQueue
      for (var i = 0; i < queue.length; i++) {
        var sprite = queue[i]

        var tW = sprite.texture.width
        var tH = sprite.texture.height
        var sX = sprite.srcX || 0
        var sY = sprite.srcY || 0
        var sW = sprite.srcWidth || (tW - sX)
        var sH = sprite.srcHeight || (tH - sY)

        sprite.srcX = sX
        sprite.srcY = sY
        sprite.srcWidth = sW
        sprite.srcHeight = sH

        sprite.dstX = sprite.dstX || 0
        sprite.dstY = sprite.dstY || 0
        sprite.dstWidth = sprite.dstWidth || sW
        sprite.dstHeight = sprite.dstHeight || sH

        sprite.rotation = sprite.rotation || 0
        sprite.originX = sprite.originX || 0
        sprite.originY = sprite.originY || 0
        
        sprite.depth = sprite.depth || 0
        sprite.flipX = !!sprite.flipX
        sprite.flipY = !!sprite.flipY
        
        let color = sprite.color as any
        if (color instanceof Graphics.Color) {
          sprite.color = color.rgba
        } else if (typeof color === 'number') {
          sprite.color = color
        } else {
          sprite.color = 0xFFFFFFFF;
        }
      }
    }

    private drawBatch() {
      var start = 0;
      var texture = void 0;
      var queue = this.spriteQueue;
      this.buildSprites()
      this.device.indexBuffer = this.indexBuffer;
      this.device.vertexBuffer = this.vertexBuffer;
      this.device.program = this.program;

      for (var i = 0; i < queue.length; i++) {
        if (texture !== queue[i].texture) {
          if (i > start) {
            this.device.program.setUniform('texture', texture);
            this.drawSlice(start, i - start);
          }
          texture = queue[i].texture;
          start = i;
        }
      }
      if (queue.length > 0 && texture) {
        this.device.program.setUniform('texture', texture);
        this.drawSlice(start, queue.length - start);
      }
    }

    private drawSlice(start:number, length:number) {
      if (length == 0) {
        return;
      }

      var queue = this.spriteQueue;
      var posTexView = this.positionTextureView;
      var colorView = this.colorBufferView;

      var texture = queue[start].texture;
      var texelX = 1.0 / texture.width;
      var texelY = 1.0 / texture.height;
      var texelViewX = 1.0 / this.device.viewportState.width;
      var texelViewY = 1.0 / this.device.viewportState.height;

      var end = start + length;
      while (start < end) {
        var slice = end - start;
        slice = slice > this.batchSize ? this.batchSize : slice;

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
          var flipX = sprite.flipX ? sprite.srcWidth : 0;
          var flipY = sprite.flipY ? sprite.srcHeight : 0;
          
          // VERTEX TOP LEFT

          // position
          posTexView[vIndex++] = (cX + cosA * p1X + sinA * p1Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p1X + cosA * p1Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = (sprite.srcX + flipX) * texelX;
          posTexView[vIndex++] = (sprite.srcY + flipY) * texelY;
          //color
          colorView[vIndex++] = sprite.color as number;

          // VERTEX TOP RIGHT

          // position
          posTexView[vIndex++] = (cX + cosA * p2X + sinA * p1Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p2X + cosA * p1Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = (sprite.srcX + sprite.srcWidth - flipX) * texelX;
          posTexView[vIndex++] = (sprite.srcY + flipY) * texelY;
          //color
          colorView[vIndex++] = sprite.color as number;

          // VERTEX BOTTOM LEFT

          // position
          posTexView[vIndex++] = (cX + cosA * p1X + sinA * p2Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p1X + cosA * p2Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = (sprite.srcX + flipX) * texelX;
          posTexView[vIndex++] = (sprite.srcY + sprite.srcHeight - flipY) * texelY;
          //color
          colorView[vIndex++] = sprite.color as number;

          // VERTEX BOTTOM RIGHT

          // position
          posTexView[vIndex++] = (cX + cosA * p2X + sinA * p2Y) * texelViewX;
          posTexView[vIndex++] = (cY - sinA * p2X + cosA * p2Y) * texelViewY;
          posTexView[vIndex++] = sprite.depth;
          // texture
          posTexView[vIndex++] = (sprite.srcX + sprite.srcWidth - flipX) * texelX;
          posTexView[vIndex++] = (sprite.srcY + sprite.srcHeight - flipY) * texelY;
          //color
          colorView[vIndex++] = sprite.color as number;
        }

        start += slice;

        var dat:any = this.positionTextureView;
        this.vertexBuffer.setSubData(dat, 0);
        this.device.drawIndexedPrimitives(Graphics.PrimitiveType.TriangleList, 0, slice * 6);
      }
    }
  }
}
