module Glib.Graphics {

  export class VertexAttribArrayState {
    device:Device;
    gl:any;
    private enabledArrays:number[];

    constructor(device:Device) {
      this.device = device;
      this.gl = device.context;
      this.enabledArrays = [];
    }

    commit(attributeLocations:number[]=[]):VertexAttribArrayState {

      var isEnabled = this.enabledArrays;

      for (var location of isEnabled) {
        if (attributeLocations.indexOf(location) < 0) {
          this.gl.disableVertexAttribArray(location);
        }
      }
      for (var location of attributeLocations) {
        if (isEnabled.indexOf(location) < 0) {
          this.gl.enableVertexAttribArray(location);
        }
      }

      isEnabled.length = attributeLocations.length;
      for (var i = 0; i < attributeLocations.length; i++) {
        isEnabled[i] = attributeLocations[i];
      }

      return this;
    }
  }
}
