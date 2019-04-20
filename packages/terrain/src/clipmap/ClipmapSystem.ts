import { Device } from '@gglib/graphics'
import { IVec3 } from '@gglib/math'
import { Clipmap } from './Clipmap'
import { ClipmapGeometry } from './ClipmapGeometry'

export class ClipmapSystem {
  private meshes: ClipmapGeometry
  private clipmaps: ReadonlyArray<Clipmap>

  public constructor(public readonly device: Device, public readonly size: number, public readonly levels: number) {
    this.meshes = new ClipmapGeometry(device, size)
    const clipmaps: Clipmap[] = []
    for (let i = 0; i < levels; i++) {
      clipmaps.push(new Clipmap(device, i, size))
    }
    this.clipmaps = clipmaps
  }

  public update(camera: IVec3) {
    //
  }
}
