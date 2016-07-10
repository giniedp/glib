module Glib.Graphics.Geometry {

  import Mat4 = Glib.Mat4;
  import Mat3 = Glib.Vec3;
  import Mat2 = Glib.Vec2;
  import BufferData = Glib.Graphics.BufferData;
  import ModelMeshOptions = Glib.Graphics.ModelMeshOptions;

  export interface BuilderOptions {
    defaultAttributes?:{[key:string]:any};
    layout?:string|{[key:string]:any};
    ignoreTransform?:boolean;
  }

  export class Builder {
    defaultAttributes:{[key:string]:any};
    layout:{[key:string]:any};
    meshes:ModelMeshOptions[] = [];

    ignoreTransform:boolean = false;
    transform:Mat4;
    uvTransform:Mat4;
    indexBuffer:BufferOptions;
    indexCount:number;
    sGroups:number[];
    vertexBuffer:BufferOptions;
    vertexCount:number;
    maxVertexCount = 65536;
    
    constructor(options:BuilderOptions = {}) {

      this.layout = Graphics.VertexLayout.convert(options.layout || 'PositionTextureNormalTangentBitangent');

      // The fallback values that should be used during the build process.
      // If any vertex is pushed into the builder with missing attributes they are resolved from here.
      this.defaultAttributes = options.defaultAttributes || {
          position: [0, 0, 0],
          normal: [0, 1, 0],
          tangent: [1, 0, 0],
          bitangent: [0, 0, 1],
          color: [Graphics.Color.Black],
          texture: [0, 0]
        };

      this.ignoreTransform = options.ignoreTransform === true;
      this.reset();
    }

    /**
     * Gets the data array of the current index buffer
     * @returns {BufferData}
     */
    get indices():BufferData {
      return this.indexBuffer.data;
    }
    set indices(value:BufferData) {
      this.indexBuffer.data = value;
    }

    /**
     * Gets the data array of the current vertex buffer
     * @returns {BufferData}
     */
    get vertices():BufferData {
      return this.vertexBuffer.data;
    }
    set vertices(value:BufferData) {
      this.vertexBuffer.data = value;
    }

    static create(options?:BuilderOptions) {
      return new Builder(options);
    }

    _resetTransform() {
      this.transform = Mat4.identity();
      this.uvTransform = Mat4.identity();
      return this;
    }

    _resetData() {
      // The new index buffer that is going to be filled with indices
      this.indexBuffer = {
        type: 'IndexBuffer',
        dataType: 'ushort',
        data: []
      };

      // The new index buffer that is going to be filled with vertices
      this.vertexBuffer = {
        layout: utils.copy(this.layout),
        type: 'VertexBuffer',
        dataType: 'float',
        data: []
      };

      // counter values
      this.indexCount = 0;
      this.vertexCount = 0;
      this.sGroups = [];
    }

    _resetMeshes() {
      this.meshes = [];
    }

    /**
     * Resets the builder state
     * @returns {Glib.Graphics.Geometry.Builder}
     */
    reset() {
      this._resetTransform();
      this._resetData();
      this._resetMeshes();
      return this;
    }

    /**
     * Pushes given indices into the state.
     */
    addIndex(index:number, sGroup?:number) {
      this.indices.push(index);
      this.sGroups.push(sGroup);
      this.indexCount += 1;
      return this;
    }

    /**
     * Pushes a single vertex definition into the state
     * @param vertex
     * @returns {Glib.Graphics.Geometry.Builder}
     */
    addVertex(vertex:{[key:string]:any}):Builder {
      if (this.vertexCount === this.maxVertexCount) {
        // throw `max vertex count reached`;
      }
      var that = this;
      var channel, item, i, layout = this.vertexBuffer.layout, defaults = this.defaultAttributes;

      Object.keys(layout).forEach(function (key:string) {
        channel = layout[key];
        item = vertex[key] || that.defaultAttributes[key];

        if (Array.isArray(item)) {
          // ok
        } else if (typeof item.dump === 'function') {
          item = item.dump();
        } else {
          throw `vertex element must be of type number[]|Vec2|Vec3|Vec4`;
        }
        item = item || defaults[key];

        if (this.ignoreTransform) {
          // do nothing
        } else if (key == 'position') {
          that.transform.transformV3Buffer(item);
        } else if (key.match('normal|tangent')) {
          that.transform.transformNormalBuffer(item);
        } else if (key.match('texture|uv')) {
          that.uvTransform.transformV2Buffer(item);
        }
        for (i = 0; i < channel.elements; i += 1) {
          that.vertices.push(item[i] || 0);
        }
      });
      this.vertexCount += 1;
      return this;
    }

    calculateNormalsAndTangents(){
      if (this.layout['normal']) {
        calculateNormals(this.layout, this.indices, this.vertices);
      }
      if (this.layout['tangent'] && this.layout['bitangent']) {
        calculateTangents(this.layout, this.indices, this.vertices);
      }
    }

    mergeDublicates() {
      var eCount = VertexLayout.countElements(this.layout);
      var hashMap = {};

      var oldIndices:any = this.indices;
      var newIndices:any = [];
      var iCounter = 0;

      var oldVertices:any = this.vertices;
      var newVertices:any = [];
      var vCounter = 0;

      for (var index of oldIndices) {
        var vertex = oldVertices.slice(index * eCount, index * eCount + eCount);
        var hash = vertex.join('|');
        var position = hashMap[hash];
        if (position == null) {
          for (var e of vertex) {
            newVertices.push(e);
          }
          position = vCounter;
          hashMap[hash] = position;
          vCounter += 1;
        }

        newIndices[iCounter] = position;
        iCounter += 1;
      }
      if (this.vertexCount != vCounter) {
        Glib.utils.debug(`[Geometry.Builder] Mesh size reduced from ${this.vertexCount} to ${vCounter} vertices.`);
        this.vertices = newVertices;
        this.vertexCount = vCounter;

        this.indices = newIndices;
        this.indexCount = iCounter;
      }
    }

    /**
     * Creates new mesh options with current index and vertex buffer and saves them in the meshes array.
     * @param options
     * @returns {Glib.Graphics.Geometry.Builder}
     */
    finishMesh(options:ModelMeshOptions = {}):Builder {
      if (this.indexCount === 0 && this.vertexCount === 0) {
        utils.warn(`[Geometry.Builder] pushMesh : called on empty builder. ignore.`);
        return this;
      }

      this.mergeDublicates();
      this.calculateNormalsAndTangents();
      
      options.materialId = options.materialId || 0;
      options.indexBuffer = this.indexBuffer;
      options.vertexBuffer = this.vertexBuffer;

      this.meshes.push(options);
      this._resetData();
      return this;
    }

    /**
     * Creates model options from the current builder state an resets the builder.
     * @param options The custom model options to be used. The 'meshes' option is ignored.
     * @returns {{materials: (Material[]|MaterialOptions[]|Array)}}
     */
    finishModelOptions(options:Glib.Graphics.ModelOptions = {}):ModelOptions {
      if (this.indices.length !== 0 || this.vertices.length !== 0) {
        this.finishMesh();
      }

      var materials = options.materials || [];
      if (!Array.isArray(materials)) {
        materials = [materials];
      }
      options.materials = materials;
      options.meshes = this.meshes;
      this.reset();
      return options;
    }

    /**
     * Creates a model from the current builder state and resets the builder.
     * @param {Glib.Graphics.Device} device The graphics device
     * @param {Glib.Graphics.ModelOptions} options The model options.
     * @returns {Model}
     */
    finishModel(device:Device, options:ModelOptions = {}):Model {
      options = this.finishModelOptions(options);
      return device.createModel(options);
    }

    /**
     * Appends geometry by using the given formula.
     * @param formulaName The formula name
     * @param options The formula options
     * @returns {Glib.Graphics.Geometry.Builder}
     */
    append(formulaName:string, options:any = {}):Builder {
      Glib.utils.debug(`[Geometry.Builder] append : ${formulaName}`, options);
      var formula = Formulas[formulaName];
      if (formula) {
        formula(this, options);
      } else {
        Glib.utils.error(`[Geometry.Builder] formula '${formulaName}' not found`);
      }
      return this;
    }
  }
}
