module Glib.MeshTools {

  import Mat4 = Vlib.Mat4;
  import Mat3 = Vlib.Vec3;
  import Mat2 = Vlib.Vec2;
  import BufferData = Glib.Graphics.BufferData;
  import ModelMeshOptions = Glib.Graphics.ModelMeshOptions;

  export interface BuilderOptions {
    defaultAttributes?:{[key:string]:any};
    layout?:string|{[key:string]:any};
  }

  export class Builder {
    defaultAttributes:{[key:string]:any};
    layout:{[key:string]:any};
    meshes:ModelMeshOptions[] = [];

    transform:Mat4;
    uvTransform:Mat4;
    indexBuffer:Graphics.BufferOptions;
    indexCount:number;
    vertexBuffer:Graphics.BufferOptions;
    vertexCount:number;

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

      this.reset();
    }

    get indices():BufferData {
      return this.indexBuffer.data;
    }

    get vertices():BufferData {
      return this.vertexBuffer.data;
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
    }

    _resetMeshes() {
      this.meshes = [];
    }

    reset() {
      this._resetTransform();
      this._resetData();
      this._resetMeshes();
      return this;
    }

    addIndex(...rest:number[]) {
      for (var i = 0; i < arguments.length; i++) {
        this.indices.push(arguments[i]);
      }
      this.indexCount += arguments.length;
      return this;
    }

    addFace(...rest:number[]) {
      for (var i = 0; i < rest.length - 2; i++) {
        this.indices.push(arguments[i]);
        this.indices.push(arguments[i + 1]);
        this.indices.push(arguments[i + 2]);
        this.indexCount += 3;
      }
      return this;
    }

    /**
     * Adds indices that define a mesh patch with `(steps + 1) * (steps + 1)` vertices.
     */

    addPatchIndices(steps, reverse) {
      var i, j, index, stride = steps + 1;
      var baseVertex = this.vertexCount;
      var indices;

      for (i = 0; i < steps; i += 1) {
        for (j = 0; j < steps; j += 1) {
          index = i * stride + j + baseVertex;
          indices = [
            index,
            index + stride,
            index + stride + 1,

            index,
            index + stride + 1,
            index + 1
          ];

          if (reverse) {
            indices = indices.reverse();
          }
          this.addIndex.apply(this, indices);
        }
      }
      return this;
    }

    /**
     * Adds a single vertex definition to the current builders state
     */
    addVertex(opts) {
      if (this.vertexCount >= 65536) {
        this.indexBuffer.dataType = 'uint';
      }
      var that = this;
      var channel, item, i, layout = this.vertexBuffer.layout, defaults = this.defaultAttributes;

      Object.keys(layout).forEach(function (key:string) {
        channel = layout[key];
        item = opts[key] || that.defaultAttributes[key];

        if (Array.isArray(item)) {
          // ok
        } else if (typeof item.dump === 'function') {
          item = item.dump();
        } else {
          throw `vertex element must be of type number[]|Vec2|Vec3|Vec4`;
        }
        item = item || defaults[key];

        if (key == 'position') {
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

    nextMesh(opts:Glib.Graphics.ModelMeshOptions={}) {
      if (this.indexCount === 0 && this.vertexCount === 0) {
        utils.warn(`[MeshBuilder] nextMesh : called on empty builder.`);
      }

      if (this.layout['normal']) {
        MeshTools.calculateNormals(this.layout, this.indices, this.vertices);
      }
      if (this.layout['tangent'] && this.layout['bitangent']) {
        MeshTools.calculateTangents(this.layout, this.indices, this.vertices);
      }

      var mesh = utils.extend({
        materialId: 0,
        indexBuffer: this.indexBuffer,
        vertexBuffer: this.vertexBuffer
      }, opts);

      this.meshes.push(mesh);
      this._resetData();
    }

    finish(device, options:{ materials?:any[]}={}):Glib.Graphics.Model {
      if (this.indices.length !== 0 || this.vertices.length !== 0) {
        this.nextMesh();
      }

      var materials = options.materials || [];
      if (!utils.isArray(materials)) {
        materials = [materials];
      }
      var model = device.createModel({
        materials: materials,
        meshes: this.meshes
      });
      this.reset();
      return model;
    }

    append(formulaName:string, options:any={}):Builder {
      Glib.utils.debug(`[MeshBuilder] append : ${formulaName}`, options);
      var formula = Glib.MeshTools.Formulas[formulaName];
      if (formula) {
        formula(this, options);
      } else {
        Glib.utils.error(`[MeshBuilder] append : formula '${formulaName}' not found`);
      }
      return this;
    }
  }
}
