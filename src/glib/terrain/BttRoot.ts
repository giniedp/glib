module Glib.Terrain {

  /// http://www.gamedevelopment.com/view/feature/130171/binary_triangle_trees_for_terrain_.php?page=2

  export class BTTRoot {
    device: Graphics.Device;
    heightMap: Terrain.HeightMap;
    patchSize: number;
    lodScale: number;
    indexBuffers:Graphics.Buffer[][];
    patches:BTTPatch[];
    model:Graphics.Model;

    constructor(device:Glib.Graphics.Device, options){
      this.device = device;

      this.heightMap = options.heightMap;
      this.patchSize = Number(options.patchSize) || 64;
      this.lodScale = Number(options.lodScale)|0 || 2;

      var maxLod = Glib.utils.highestBit(this.patchSize) * 2;
      var iBuffers = this.indexBuffers = [];
      for (var i = 0; i <= maxLod; i++) {
        iBuffers[i] = [];
        for (var j = 0; j < 15; j++) {
          if ((i % 2 === 0) && j > 0) {
            iBuffers[i][j] = iBuffers[i][0];
          } else {
            var data = Terrain.BTTPatch.createIndices(i, j, this.patchSize + 1);
            iBuffers[i][j] = new Glib.Graphics.Buffer(device, {
              type: 'IndexBuffer',
              dataType: 'ushort',
              data: data
            });
            iBuffers[i][j].data = data;
          }
        }
      }

      var patches = [];
      var meshes = [];
      for (var y = 0; y < this.heightMap.height; y += this.patchSize) {
        for (var x = 0; x < this.heightMap.width; x += this.patchSize) {
          var patch = new Terrain.BTTPatch(device, {
            parent: this,
            startX: x,
            startY: y
          });
          patches.push(patch);
          meshes.push(patch.mesh);
        }
      }

      this.patches = patches;
      this.model = device.createModel({
        materials: options.materials,
        meshes: meshes
      });
    }

    updateLod(viewPos:IVec3){
      BTTPatch.updateLod(viewPos, this.patches);
    }
  }
}
