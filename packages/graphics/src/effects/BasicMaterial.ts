import { IVec3, vec3, Vec3 } from '@gglib/math'
import type { Device } from '../Device'
import { basicEffectInputs, basicEffectOptions, BasicMaterialSchema } from './BasicEffect'
import { MaterialOptions } from './Material'
import { materialSchemaClass } from './MaterialSchema'
import { CommonMaterialProps } from './types'

export interface BasicMaterialOptions extends MaterialOptions {
  instancing?: boolean
}

export class BasicMaterial extends materialSchemaClass(BasicMaterialSchema) {
  public constructor(device: Device, options?: BasicMaterialOptions) {
    super(device, {
      name: options?.name ?? 'Basic Effect Material',
      effect: basicEffectOptions(),
      inputs: basicEffectInputs(),
      meta: options?.meta ?? {},
    })
    if (options?.properties) {
      this.setProperties(options?.properties)
    }
  }

  public setProperties(props: CommonMaterialProps) {
    if (!props) {
      return
    }

    if (props.BaseColor) {
      this.BaseColor.initFrom(vec3(props.BaseColor))
    }

    if (props.EmissiveColor) {
      this.EmissiveColor.initFrom(vec3(props.EmissiveColor))
    }

    if (props.SpecularColor) {
      this.SpecularColor.initFrom(vec3(props.SpecularColor))
    }

    if (props.Roughness != null) {
      this.Roughness = props.Roughness
    }

    if (props.Opacity != null) {
      this.Alpha = props.Opacity
    }

    if (props.BaseColorMap) {
      this.set('baseColorMap', props.BaseColorMap)
      this.TextureEnabled = 1
    }

    if (props.AlphaClip != null) {
      this.AlphaClip = props.AlphaClip
    }
  }

  public setDirectionalLight(index: 0 | 1 | 2 | 3, color: IVec3, direction: IVec3) {
    this.get(`lights.color[${index}]`).initFrom(color).setW(1)
    this.get(`lights.direction[${index}]`).initFrom(direction).setW(0)
  }

  public setPointLight(index: 0 | 1 | 2 | 3, color: Vec3, position: Vec3, range: number) {
    this.get(`lights.color[${index}]`).initFrom(color).setW(2)
    this.get(`lights.position[${index}]`).initFrom(position).setW(range)
  }

  public setSpotLight(
    index: 0 | 1 | 2 | 3,
    color: Vec3,
    position: Vec3,
    direction: Vec3,
    range: number,
    angle: number,
  ) {
    this.get(`lights.color[${index}]`).initFrom(color).setW
    this.get(`lights.position[${index}]`).initFrom(position).setW(range)
    this.get(`lights.direction[${index}]`).initFrom(direction).setW(angle)
  }

  public setLightDisabled(index: 0 | 1 | 2 | 3) {
    this.get(`lights.color[${index}]`).setW(0)
  }
}
