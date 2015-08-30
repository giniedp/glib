module Glib.Terrain {

  import Vec3 = Glib.Vec3;

  export class BTTPatch {
    device:Graphics.Device;

    /**
     * The current level of detail. Higher values means higher details.
     * The lowest detail is 0 and shows the patch with only 2 triangles.
     * @property currentLOD
     * @type {number}
     */
    currentLOD:number = 0;

    /**
     * The neighbor LOD code. The value should be in range [0,14].
     * This has the influence of how the patch is aligned to the neighbors, so gaps
     * between patches are closed.
     * @property currentVersion
     * @type {number}
     */
    currentVersion:number = 0;    

    parent:any;
    patchSize:number;
    center:Glib.IVec3;

    constructor(device:Graphics.Device, options) {
      this.device = device;

      this.parent = options.parent;
      this.patchSize = parent.patchSize;
      this.center = {
        x: options.startX + (this.patchSize - 1) / 2,
        y: 0,
        z: options.startY + (this.patchSize - 1) / 2)
      };

      this.mesh = new Glib.Graphics.ModelMesh(device, {
        indexBuffer: this.parent.indexBuffers[0][0],
        vertexBuffer: device.createVertexBuffer({
          layout: Glib.Graphics.VertexLayout.create('PositionNormalTexture'),
          dataType: 'float',
          data: createVertices(
            this.parent.heightMap,
            this.startX,
            this.startY,
            this.patchSize + 1);
        });
      });
    }

    updateLOD(viewPos:IVec3){
      var maxLOD = this.parent.indexBuffers[0].length;

      var d = Glib.Vec3.distance(viewPos, this.center);
      var max = this.patchSize * maxLOD * this.parent.LODScale;
      var t = 1 - Math.min(Math.max(d / max, 0), 1);

      this.currentLOD = Math.ceil(t * maxLOD);
      this.mesh.indexBuffer = this.parent.indexBuffers[this.currentLOD][this.currentVersion];
    };

    static _viewPos = { x:0, y:0, z: 0 };
    static updateLOD(viewPos, patches:Patch[]){
      var vPos = Patch._viewPos;
      vPos.x = viewPos.x;
      vPos.y = 0;
      vPos.z = viewPos.z;
      for (var patch of patches) {
        patch.updateLOD(vPos);
      }
      for (var patch of patches) {
        patch.updateVersion(vPos);
      }
    }

    getSibling(x, y){
      var parent = this.parent;
      var pCount = (parent.heightmap.width / this.patchSize)|0;
      var index = parent.patches.indexOf(this) + x + y * pCount;
      return parent.patches[index];
    };

    updateVersion(){

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

      this.mesh.indexBuffer = this.parent.indexBuffers[this.currentLOD][this.currentVersion];
    }

    static createVertices(heightmap:HeightMap, startX:number, startY:number, size:number): Float32Array {
      var normal = { x:0, y:0, z:0 };
      var vertices = new Float32Array();
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

    static createIndices(level:number, version:number, size:number){

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
  }
}
