(function (Gin) {
  'use strict';

  var Vec3 = window.Vec3;

  /**
   *
   * @param gfx
   * @param options
   * @constructor
   */
  Gin.Terrain.Patch = function(gfx, options){
    /**
     * @property gfx
     * @type {Gin.Graphics.Device}
     */
    this.gfx = gfx;

    /**
     * @property gl
     * @type {Object}
     */
    this.gl = gfx.context;

    /**
     * The current level of detail. Higher values means higher details.
     * The lowest detail is 0 and shows the patch with only 2 triangles.
     * @property currentLOD
     * @type {number}
     */
    this.currentLOD = 0;

    /**
     * The neighbor LOD code. The value should be in range [0,14].
     * This has the influence of how the patch is aligned to the neighbors, so gaps
     * between patches are closed.
     * @property currentVersion
     * @type {number}
     */
    this.currentVersion = 0;

    /**
     * @property parent
     * @type {Gin.Terrain}
     */
    this.parent = options.parent;
    var parent = this.parent;

    /**
     * @property heightmap
     * @type {Gin.Terrain.Heightmap}
     */
    this.heightmap = options.heightmap;

    /**
     * @property patchSize
     * @type {number}
     */
    this.patchSize = parent.patchSize;

    /**
     * The untransformed center position of this patch at ground level.
     * @property center
     * @type {Vec3}
     */
    this.center = Vec3.create(options.startX + (this.patchSize - 1) / 2, 0, options.startY + (this.patchSize - 1) / 2);

    /**
     * Collection of level of detail index buffers
     * @property indexBuffers
     * @type Array
     */
    this.indexBuffers = options.indexBuffers;

    /**
     * The renderable mesh
     * @property mesh
     * @type Gin.Graphics.ModelMesh
     */
    this.mesh = new Gin.Graphics.ModelMesh(gfx, {
      indexBuffer: this.parent.indexBuffers[0][0],
      vertexBuffer: new Gin.Graphics.Buffer(gfx, {
        layout: Gin.Graphics.VertexLayout.create('PositionNormalTexture'),
        type: 'VertexBuffer',
        dataType: 'float',
        data: createVertices({
          startX: options.startX,
          startY: options.startY,
          heightmap: parent.heightmap,
          size: parent.patchSize + 1
        })
      })
    });
  };

  var patchProto = Gin.Terrain.Patch.prototype;

  patchProto.updateLOD = function(viewPos){
    var maxLOD = this.parent.indexBuffers[0].length;

    var d = viewPos.distance(this.center);
    var max = this.patchSize * maxLOD * this.parent.LODScale;
    var t = 1 - Math.min(Math.max(d / max, 0), 1);

    this.currentLOD = Math.ceil(t * maxLOD);
    this.indexBuffer = this.parent.indexBuffers[this.currentLOD][this.currentVersion];
    this.mesh.indexBuffer = this.indexBuffer;
  };

  patchProto.getSibling = function(x, y){
    var parent = this.parent;
    var pCount = (parent.heightmap.width / this.patchSize)|0;
    var index = parent.patches.indexOf(this) + x + y * pCount;
    return parent.patches[index];
  };

  patchProto.updateVersion = function(){

    var lod = this.currentLOD;
    if (lod & 1){
      var t = (this.getSibling( 0, -1) || this).currentLOD;
      var r = (this.getSibling( 1,  0) || this).currentLOD;
      var b = (this.getSibling( 0,  1) || this).currentLOD;
      var l = (this.getSibling(-1,  0) || this).currentLOD;

      var version = 0;
      version |= t > lod ? 1 : version;
      version |= r > lod ? 2 : version;
      version |= b > lod ? 4 : version;
      version |= l > lod ? 8 : version;
      this.currentVersion = version;
    }

    this.indexBuffer = this.parent.indexBuffers[this.currentLOD][this.currentVersion];
    this.mesh.indexBuffer = this.indexBuffer;
  };

  function createVertices(options){
    var startX = options.startX || 0;
    var startY = options.startY || 0;
    var heightmap = options.heightmap;
    var size = options.size;
    var normal = Vec3.zero();
    var vertices = [];
    for (var y = startY; y < startY + size; y++) {
      for (var x = startX; x < startX + size; x++) {

        // position
        vertices.push(x);
        vertices.push(heightmap.heightAt(x, y));
        vertices.push(y);

        // normal
        heightmap.normalAt(x, y, normal);
        vertices.push(normal.x);
        vertices.push(normal.y);
        vertices.push(normal.z);

        // texture
        vertices.push(x / (heightmap.width));
        vertices.push(y / (heightmap.height));
      }
    }
    return vertices;
  }

}(window.Gin));
