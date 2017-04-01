// tslint:disable:no-bitwise

module Glib.Terrain {

  /// http://www.gamedevelopment.com/view/feature/130171/binary_triangle_trees_for_terrain_.php?page=2

  export class BTTRoot {
    public device: Graphics.Device
    public heightMap: Terrain.HeightMap
    public patchSize: number
    public lodScale: number
    public indexBuffers: Graphics.Buffer[][]
    public patches: BTTPatch[]
    public model: Graphics.Model

    constructor(device: Glib.Graphics.Device, options) {
      this.device = device

      this.heightMap = options.heightMap
      this.patchSize = Number(options.patchSize) || 64
      this.lodScale = Number(options.lodScale) | 0 || 2

      const maxLod = Glib.utils.highestBit(this.patchSize) * 2
      const iBuffers = this.indexBuffers = []
      for (let i = 0; i <= maxLod; i++) {
        iBuffers[i] = []
        for (let j = 0; j < 15; j++) {
          if ((i % 2 === 0) && j > 0) {
            iBuffers[i][j] = iBuffers[i][0]
          } else {
            const data = Terrain.BTTPatch.createIndices(i, j, this.patchSize + 1)
            iBuffers[i][j] = new Glib.Graphics.Buffer(device, {
              data: data,
              dataType: 'ushort',
              type: 'IndexBuffer'
            })
            iBuffers[i][j].data = data
          }
        }
      }

      const patches = []
      const meshes = []
      for (let y = 0; y < this.heightMap.height; y += this.patchSize) {
        for (let x = 0; x < this.heightMap.width; x += this.patchSize) {
          const patch = new Terrain.BTTPatch(device, {
            parent: this,
            startX: x,
            startY: y
          })
          patches.push(patch)
          meshes.push(patch.mesh)
        }
      }

      this.patches = patches
      this.model = device.createModel({
        materials: options.materials,
        meshes: meshes
      })
    }

    public updateLod(viewPos: IVec3) {
      BTTPatch.updateLod(viewPos, this.patches)
    }
  }
}
