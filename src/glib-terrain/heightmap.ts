module Glib.Terrain {

  export interface HeightMapOptions {
    width:number;
    height:number;
    heights?:Float32Array|number[];
    normals?:Float32Array|number[];
  }

  export class HeightMap {

    width:number;
    height:number;
    heights:Float32Array;
    normals:Float32Array;

    constructor(options:HeightMapOptions){
      this.width = options.width;
      this.height = options.height;

      var heights:any = options.heights;
      if (Array.isArray(heights)) {
        this.heights = new Float32Array(heights);
      } else {
        this.heights = new Float32Array(this.width * this.height);
      }

      var normals:any = options.normals;
      if (Array.isArray(normals)) {
        this.normals = new Float32Array(normals);
      } else {
        this.normals = new Float32Array(this.width * this.height * 3);
        this.calculateNormals();
      }
    }

    heightAt(x:number, y:number):number {
      if (x >=0 && x < this.width && y >= 0 && y < this.height){
        return this.heights[(x + y * this.width)|0];
      }
      return 0;
    }

    normalAt(x:number, y:number, out?:IVec3):IVec3 {
      out = out || new Glib.Vec3();
      x = Math.min(x, this.width - 1);
      y = Math.min(y, this.height - 1);
      if (x >=0 && y >= 0) {
        var index = (x + y * this.width) * 3;
        out.x = this.normals[index];
        out.y = this.normals[index + 1];
        out.z = this.normals[index + 2];
      } else {
        out.x = 0;
        out.y = 1;
        out.z = 0;
      }
      return out;
    }

    calculateNormals():HeightMap{
      var normal = Glib.Vec3.zero();
      var index = 0;
      for(var y = 0; y < this.height; y += 1){
        for(var x = 0; x < this.width; x += 1){
          this.calculateNormalAt(x, y, normal).copyTo(this.normals, index);
          index += 3;
        }
      }
      return this;
    }

    calculateNormalAt(x, z, out){
      var w1 = 0.5;
      var w2 = 1.0;
      var width = this.width;
      var sIndex = x + z * width;
      var field = this.heights;
      out = out || Glib.Vec3.zero();

      sIndex -= width;
      var tl = (field[sIndex - 1] || 0) * w1;
      var t =  (field[sIndex    ] || 0) * w2;
      var tr = (field[sIndex + 1] || 0) * w1;

      sIndex += width;
      var l =  (field[sIndex - 1] || 0) * w2;
      var r =  (field[sIndex + 1] || 0) * w2;

      sIndex += width;
      var bl = (field[sIndex - 1] || 0) * w1;
      var b =  (field[sIndex    ] || 0) * w2;
      var br = (field[sIndex + 1] || 0) * w1;

      var dx = tl + l + bl - tr - r - br;
      var dy = tl + t + tr - bl - b - br;

      return out.init(dx, 1, dy).selfNormalize();
    }

    rescale(scale:number):HeightMap{
      var index = 0;
      var nIndex = 0;
      var normal = Glib.Vec3.zero();

      for(var y = 0; y < this.height; y += 1){
        for(var x = 0; x < this.width; x += 1){
          this.heights[index] *= scale;
          this.normals[nIndex + 1] /= scale;
          normal.initFromBuffer(this.normals, nIndex).normalize().copyTo(this.normals, nIndex);
          index += 1;
          nIndex += 3;
        }
      }
      return this;
    }

    static fromImage(image, width, height){
      return new HeightMap({
        heights: Glib.utils.getImageData(image, width, height),
        width: width || image.naturalWidth,
        height: height || image.naturalHeight
      });
    }
  }
}
