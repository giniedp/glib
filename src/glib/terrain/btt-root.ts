module Glib.Terrain {

  /// http://www.gamedevelopment.com/view/feature/130171/binary_triangle_trees_for_terrain_.php?page=2

  export class BttRoot {
    
    consturctor(device:Glib.Graphics.Device, options){
      this.device = device;

      this.heightMap = options.heightMap;
      this.patchSize = Number(options.patchSize) || 64;
      this.LODScale = Number(options.LODScale)|0 || 2;

      var maxLod = Glib.utils.highestBit(this.patchSize) * 2;
      
      var iBuffers = [];
      for (var i = 0; i <= maxLod; i++) {
        iBuffers[i] = [];
        for (var j = 0; j < 15; j++) {
          if ((i % 2 === 0) && j > 0) {
            iBuffers[i][j] = iBuffers[i][0];
          } else {
            var data = createIndices({
              level: i,
              version: j,
              size: this.patchSize + 1
            });
            iBuffers[i][j] = new Gin.Graphics.Buffer(this.gfx, {
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
          var patch = new Terrain.BttPatch(device, {
            parent: this,
            startX: x,
            startY: y
          });
          this.patches.push(patch);
          this.meshes.push(patch.mesh);
        }
      }

      this.indexBuffers = iBuffers;
      this.patches = patches;
      this.model = device.createModel({
        materials: options.materials,
        meshes: meshes
      });
    },
    update: function(){
      this.renderable.models.length = 0;
      this.renderable.models.push(this.model);
    }
  });

}
