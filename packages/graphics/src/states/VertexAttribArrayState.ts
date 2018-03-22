import { Device } from './../Device'

/**
 * @public
 */
export class VertexAttribArrayState {
  public device: Device
  public gl: WebGLRenderingContext
  private enabledArrays: number[]

  constructor(device: Device) {
    this.device = device
    this.gl = device.context
    this.enabledArrays = []
  }

  public commit(attributeLocations: number[]= []): VertexAttribArrayState {

    let enabled = this.enabledArrays

    for (let location of enabled) {
      if (attributeLocations.indexOf(location) < 0) {
        this.gl.disableVertexAttribArray(location)
      }
    }
    for (let location of attributeLocations) {
      if (enabled.indexOf(location) < 0) {
        this.gl.enableVertexAttribArray(location)
      }
    }

    enabled.length = attributeLocations.length
    for (let i = 0; i < attributeLocations.length; i++) {
      enabled[i] = attributeLocations[i]
    }

    return this
  }
}
