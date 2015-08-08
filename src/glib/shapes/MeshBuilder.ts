module Glib.MeshTools {

  import Mat4 = Vlib.Mat4;
  import Mat3 = Vlib.Vec3;
  import Mat2 = Vlib.Vec2;

  export class MeshBuilder {

    transformConfig:any;
    layout:any;
    defaults:any;
    meshes:Graphics.ModelMesh[] = [];

    transform:Mat4;
    uvTransform:Mat4;
    indexBuffer:Graphics.BufferOptions;
    indices:any;
    indexCount:number;
    vertexBuffer:Graphics.BufferOptions;
    vertices:any;
    vertexCount:number;

    constructor(options:any = {}) {

      this.transformConfig = options.transform || {
          position: 'position',
          normal: 'normal'
        };

      // Get the vertex buffer layout.
      // Fallback to a position/normal layout
      var layout = options.layout || 'PositionTextureNormalTangentBitangent';
      if (typeof layout === 'string') {
        this.layout = Graphics.VertexLayout.create(layout);
      } else {
        this.layout = layout;
      }

      // The fallback values that should be used during the build process.
      // If any vertex is pushed into the builder with missing attributes they are resolved from here.
      this.defaults = options.defaults || {
          position: [0, 0, 0],
          normal: [0, 1, 0],
          tangent: [1, 0, 0],
          bitangent: [0, 0, 1],
          color: [Graphics.Color.Black],
          texture: [0, 0]
        };

      // The final collection of created meshed.
      this.meshes = [];
      this.reset();
    }

    static create(options) {
      return new MeshBuilder(options);
    }

    resetTransform() {
      this.transform = Mat4.identity();
      this.uvTransform = Mat4.identity();
      return this;
    }

    resetData() {
      // The new index buffer that is going to be filled with indices
      this.indexBuffer = {
        type: 'IndexBuffer',
        dataType: 'ushort',
        data: []
      };
      // A shorthand to the indices of the index buffer
      this.indices = this.indexBuffer.data;

      // The new index buffer that is going to be filled with vertices
      this.vertexBuffer = {
        layout: utils.copy(this.layout),
        type: 'VertexBuffer',
        dataType: 'float',
        data: []
      };
      // A shorthand to the vertices of the vertex buffer
      this.vertices = this.vertexBuffer.data;

      // counter values
      this.indexCount = 0;
      this.vertexCount = 0;
    }

    resetMeshes() {
      this.meshes = [];
    }

    reset() {
      this.resetTransform();
      this.resetData();
      this.resetMeshes();
      return this;
    }

    addIndex() {
      var i;
      for (i = 0; i < arguments.length; i += 1) {
        this.indices.push(arguments[i]);
      }
      this.indexCount += arguments.length;
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
      var channel, item, i, layout = this.vertexBuffer.layout, defaults = this.defaults;

      Object.keys(layout).forEach(function (key:string) {
        channel = layout[key];
        item = opts[key] || that.defaults[key];

        if (typeof item.dump === 'function') {
          item = item.dump();
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

    /**
     * Finishes the current state by storing it into the `meshes` list. Resets the data so that another mesh can be
     * created.
     */
    closeMesh(opts?:any) {
      if (this.indexCount === 0 && this.vertexCount === 0) {
        utils.log("closeMesh called but MeshBuilder was empty. Generating an empty mesh");
      }

      if (this.layout.normal) {
        MeshTools.calculateNormals(this.layout, this.indices, this.vertices);
      }
      if (this.layout.tangent && this.layout.bitangent) {
        MeshTools.calculateTangents(this.layout, this.indices, this.vertices);
      }

      var mesh = utils.extend({
        material: 0,
        indexBuffer: this.indexBuffer,
        vertexBuffer: this.vertexBuffer
      }, opts);

      this.meshes.push(mesh);
      this.resetData();
      return mesh;
    }

    /**
     *
     */
    closeModel(gfx, materials) {
      if (this.indices.length !== 0 || this.vertices !== 0) {
        this.closeMesh();
      }

      if (!utils.isArray(materials)) {
        materials = [materials];
      }
      var model = new Graphics.Model(gfx, {
        materials: materials,
        meshes: this.meshes
      });
      this.reset();
      return model;
    }
  }
}
