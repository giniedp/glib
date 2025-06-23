import {
  CullState,
  DepthState,
  Device,
  Material,
  MaterialOptions,
  MaterialOptionsBase,
  MaterialParameters,
  skyboxProgram,
  Texture,
} from '@gglib/graphics'
import { IMat } from '@gglib/math'

export interface SkyboxParameters extends MaterialParameters {
  World?: IMat
  View?: IMat
  Projection?: IMat
  Texture?: Texture
  Intensity?: number
  Rotation?: number
  Blur?: number
  MipCount?: number
}

export class SkyboxMaterial extends Material<SkyboxParameters> {
  public get Texture(): Texture {
    return this.parameters.Texture
  }

  public set World(value: IMat) {
    this.parameters.World = value
  }
  public get World(): IMat {
    return this.parameters.World
  }

  public set View(value: IMat) {
    this.parameters.View = value
  }
  public get View(): IMat {
    return this.parameters.View
  }

  public set Projection(value: IMat) {
    this.parameters.Projection = value
  }
  public get Projection(): IMat {
    return this.parameters.Projection
  }

  public set Texture(value: Texture) {
    this.parameters.Texture = value
  }

  public get Intensity(): number {
    return this.parameters.Intensity
  }

  public set Intensity(value: number) {
    this.parameters.Intensity = value
  }

  public get Rotation(): number {
    return this.parameters.Rotation
  }

  public set Rotation(value: number) {
    this.parameters.Rotation = value
  }

  public get Blur(): number {
    return this.parameters.Blur
  }

  public set Blur(value: number) {
    this.parameters.Blur = value
  }

  public get MipCount(): number {
    return this.parameters.MipCount
  }

  public set MipCount(value: number) {
    this.parameters.MipCount = value
  }

  public constructor(device: Device, options: MaterialOptionsBase<SkyboxParameters>) {
    super(device, options as any)
  }

  public override createEffect(options: MaterialOptions): void {
    this._effect?.dispose()
    this._effect = this.device.createEffect({
      techniques: [
        {
          passes: [
            {
              program: skyboxProgram(this.device),
              depthState: DepthState.DepthRead,
              cullState: CullState.CullNone,
            },
          ],
        },
      ],
    })
  }
}
