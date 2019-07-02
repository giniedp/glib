export interface ILightParams {
  enabled: boolean
  write(buffer: Float32Array, offset: number): void
}
