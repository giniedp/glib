(function(Gin){
  'use strict';

  /// http://www.gamedevelopment.com/view/feature/130171/binary_triangle_trees_for_terrain_.php?page=2

  /**
   *
   * @module Terrain
   * @class Gin.Terrain
   * @constructor
   * @param gfx
   * @param options
   * @extends Gin.Component
   */
  Gin.Terrain = Gin.Component.extend({
    serviceName: 'terrain',
    heightmap: undefined,
    setup: function(){
      this.gfx = this.app.getService('gfx');
      this.renderable = this.getService('renderable');

      this.patchSize = Number(this.patchSize) || 64;
      this.LODScale = Number(this.LODScale)|0 || 2;

      var maxLod = Gin.Util.highestBit(this.patchSize) * 2;
      /**
       * @property indexBuffers
       * @type {Array}
       */
      this.indexBuffers = [];
      var buffers = this.indexBuffers;
      for (var i = 0; i <= maxLod; i++) {
        buffers[i] = [];
        for (var j = 0; j < 15; j++) {
          if ((i % 2 === 0) && j > 0) {
            buffers[i][j] = buffers[i][0];
          } else {
            var data = createIndices({
              level: i,
              version: j,
              size: this.patchSize + 1
            });
            buffers[i][j] = new Gin.Graphics.Buffer(this.gfx, {
              type: 'IndexBuffer',
              dataType: 'ushort',
              data: data
            });
            buffers[i][j].data = data;
          }
        }
      }

      var hMap = this.heightmap;
      this.patches = [];
      this.meshes = [];
      for (var y = 0; y < hMap.height; y += this.patchSize) {
        for (var x = 0; x < hMap.width; x += this.patchSize) {
          var patch = new Gin.Terrain.Patch(this.gfx, {
            parent: this,
            startX: x,
            startY: y
          });
          this.patches.push(patch);
          this.meshes.push(patch.mesh);
        }
      }

      this.model = new Gin.Graphics.Model(this.gfx, {
        materials: this.materials,
        meshes: this.meshes
      });
    },
    update: function(){
      this.renderable.models.length = 0;
      this.renderable.models.push(this.model);
    }
  });

  var proto = Gin.Terrain.prototype;

  var vPos;
  proto.updateLOD = function(viewPos){
    vPos = (vPos || window.Vec3.zero()).initFrom(viewPos);
    vPos.y = 0;
    for (var i = 0; i < this.patches.length; i += 1){
      this.patches[i].updateLOD(vPos);
    }
    for (i = 0; i < this.patches.length; i += 1){
      this.patches[i].updateVersion(vPos);
    }
  };

  function createIndices(options){
    var level = options.level;
    var version = options.version;
    var size = options.size;

    var list = [];
    if (level === 0){
      list.push(0);
      list.push(size - 1);
      list.push(size * size - 1);

      list.push(0);
      list.push(size * size - 1);
      list.push(size * size - size);
      return list;
    }

    var isEven = (level % 2) === 0;
    var density = Math.pow(2, Math.floor(level / 2.0));
    var step = Math.ceil((size - 1) / density)|0;
    var halfStep = (step / 2)|0;

    var vIndex = 0;
    for (var z = 0; z < size - 1; z += step) {
      for (var x = 0; x < size - 1; x += step) {
        vIndex = x + z * size;

        if (isEven) {
          var mod = 2 * step;
          if (((x % mod) === 0 && (z % mod) === 0) || ((x % mod) !== 0 && (z % mod) !== 0)) {
            // a--b---
            // |\ | /|
            // | \|/ |
            // c--d--*
            // | /|\ |
            // |/ | \|
            // ---*--*

            list.push(vIndex);
            list.push(vIndex + step);
            list.push(vIndex + size * step + step);

            list.push(vIndex);
            list.push(vIndex + size * step + step);
            list.push(vIndex + size * step);

          } else {
            // ---a--b
            // |\ | /|
            // | \|/ |
            // *--c--d
            // | /|\ |
            // |/ | \|
            // *--*---

            list.push(vIndex);
            list.push((vIndex + step));
            list.push((vIndex + size * step));

            list.push((vIndex + step));
            list.push((vIndex + size * step + step));
            list.push((vIndex + size * step));
          }
        } else {
          // a--d--g
          // |\ | /|
          // | \|/ |
          // b--e--h
          // | /|\ |
          // |/ | \|
          // c--f--i

          var a = vIndex;
          var b = vIndex + size * halfStep;
          var c = vIndex + size * step;
          var d = a + halfStep;
          var e = b + halfStep;
          var f = c + halfStep;
          var g = a + step;
          var h = b + step;
          var i = c + step;

          var order = [];
          var top = 0;
          var bot = (size - 1) - step;
          var left = 0;
          var right = (size - 1) - step;

          var mask = 0;
          mask |= (z === top ? 1 : 0);
          mask |= (x === right ? 2 : 0);
          mask |= (z === bot ? 4 : 0);
          mask |= (x === left ? 8 : 0);
          mask &= version;

          if (mask & 1){
            order = order.concat([ e, a, d, e, d, g ]);
          } else {
            order = order.concat([ e, a, g ]);
          }

          if (mask & 2){
            order = order.concat([ e, g, h, e, h, i ]);
          } else {
            order = order.concat([ e, g, i ]);
          }

          if (mask & 4){
            order = order.concat([ e, i, f, e, f, c ]);
          } else {
            order = order.concat([ e, i, c ]);
          }

          if (mask & 8){
            order = order.concat([ e, c, b, e, b, a ]);
          } else {
            order = order.concat([ e, c, a ]);
          }

          for (var k = 0; k < order.length; k++) {
            list.push(order[k]);
          }

        }
      }
    }

    return list;
  }
}(window.Gin));
