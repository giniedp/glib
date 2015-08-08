module Glib.Graphics {

  import debug = Glib.utils.debug;

  export interface ShaderProgramOptions {
    vertexShader?: string|Object|Shader,
    fragmentShader?: string|Object|Shader,
    attributes?: Object,
    uniforms?: Object,
    handle?: WebGLProgram
  }

  export class ShaderProgram {
    device:Device;
    gl:any;
    attached:Shader[] = [];
    shader:Shader[] = [];
    handle:WebGLProgram;
    attributes = {};
    uniforms = {};
    linked:boolean;
    info:string;

    constructor(device:Device, data:ShaderProgramOptions={}) {
      this.device = device;
      this.gl = device.context;
      this.attributes = data.attributes || {};
      this.uniforms = data.uniforms || {};
      this.handle = data.handle;

      var shaders = [];
      var shader = data.vertexShader;
      if (typeof shader === 'string') {
        shader = {source: shader, type: ShaderType.VertexShader};
      }
      if (shader) {
        shaders.push(shader);
      }

      shader = data.fragmentShader;
      if (typeof shader === 'string') {
        shader = {source: shader, type: ShaderType.FragmentShader};
      }
      if (shader) {
        shaders.push(shader);
      }

      for (shader of shaders) {
        
        if (shader instanceof Shader) {
          this.shader.push(shader)
        } else {
          this.shader.push(new Shader(this.device, shader))
        }
      }

      if (!this.handle || !this.gl.isProgram(this.handle)) {
        this.handle = this.gl.createProgram();
      }
      this.link();
      this._cache();
    }

    destroy():ShaderProgram {
      if (this.gl.isProgram(this.handle)) {
        this.gl.deleteProgram(this.handle);
        this.handle = null;
      }
      return this;
    }

    use():ShaderProgram {
      this.device.bindProgram(this);
      return this;
    }

    _attach():ShaderProgram {
      for (var i = 0; i < this.shader.length; i += 1) {
        this.gl.attachShader(this.handle, this.shader[i].handle);
        this.attached.push(this.shader[i]);
      }
      return this;
    }

    _detach():ShaderProgram {
      for (var i = 0; i < this.attached.length; i += 1) {
        this.gl.detachShader(this.handle, this.attached[i].handle);
      }
      this.attached.length = 0;
      return this;
    }

    _cache():ShaderProgram {
      this.use();
      var key, attribute;
      for (key in this.attributes) { // jshint ignore:line
        attribute = this.attributes[key];
        attribute.location = this.gl.getAttribLocation(this.handle, attribute.name || key);
        if (attribute.location >= 0) {
          this.gl.enableVertexAttribArray(attribute.location);
        } else {
          debug(`Vertex attribute '${attribute.name || key}' not found in shader`, this);
        }
      }
      for (key in this.uniforms) { // jshint ignore:line
        this.uniforms[key] = new ShaderUniform(this, key, this.uniforms[key]);
      }
      return this;
    }

    link():ShaderProgram {
      if (this.shader.length === 0) {
        debug('ShaderProgram#link ignored because no shaders given.', this);
        return this;
      }

      this._detach();
      this._attach();

      this.gl.linkProgram(this.handle);
      this.linked = this.gl.getProgramParameter(this.handle, this.gl.LINK_STATUS);
      this.info = this.gl.getProgramInfoLog(this.handle);

      if (!this.linked) {
        debug('ShaderProgram#link failed', this.info);
      }
      return this;
    }

    commit(params?:any):ShaderProgram {
      if (!params) {
        return this;
      }
      var u, key, param, uniforms = this.uniforms;
      for (key in uniforms) { // jshint ignore:line
        u = uniforms[key];
        if (!u || !u.set) {
          continue;
        }
        param = params[key];
        if (param) {
          u.set(param);
        }
      }
      return this;
    }
  }
}
