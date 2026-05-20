import { IVec3, vec3, Vec3, vec4 } from '@gglib/math'
import type { Device } from '../Device'
import { basicEffectOptions, BasicMaterialSchema } from './BasicEffect'
import { MaterialOptions } from './Material'
import { materialSchemaClass } from './MaterialSchema'
import { CommonMaterialProps } from './types'

export class BasicMaterial extends materialSchemaClass(BasicMaterialSchema) {
  public constructor(device: Device, options?: Partial<MaterialOptions>) {
    super(device, {
      name: options?.name ?? 'Basic Effect Material',
      effect: basicEffectOptions(),
      meta: options?.meta ?? {},
    })
    this.setDefaults()
    if (options?.properties) {
      this.setProperties(options?.properties)
    }
  }

  public setDefaults() {
    this.BaseColor = vec3([1, 1, 1])
    this.EmissiveColor = vec3([0, 0, 0])
    this.SpecularColor = vec3([1, 1, 1])
    this.Roughness = 0.5
    this.Alpha = 1
    this.AlphaClip = 0
    this.TextureEnabled = 0
    this.TextureScaleOffset = vec4([1, 1, 0, 0])
  }

  public setProperties(props: CommonMaterialProps) {
    if (!props) {
      return
    }

    if (props.BaseColor) {
      this.BaseColor = vec3(props.BaseColor)
    }

    if (props.EmissiveColor) {
      this.EmissiveColor = vec3(props.EmissiveColor)
    }

    if (props.SpecularColor) {
      this.SpecularColor = vec3(props.SpecularColor)
    }

    if (props.Roughness != null) {
      this.Roughness = props.Roughness
    }

    if (props.Opacity != null) {
      this.Alpha = props.Opacity
    }

    if (props.BaseColorMap) {
      this.Texture = props.BaseColorMap as any
      this.TextureEnabled = 1
    }

    if (props.AlphaClip != null) {
      this.AlphaClip = props.AlphaClip
    }
  }

  public setDirectionalLight(index: 0 | 1 | 2 | 3, color: IVec3, direction: IVec3) {
    this.set('lights', `color[${index}]`, { x: color.x, y: color.y, z: color.z, w: 1 })
    this.set('lights', `direction[${index}]`, { x: direction.x, y: direction.y, z: direction.z, w: 1 })
  }

  public setPointLight(index: 0 | 1 | 2 | 3, color: Vec3, position: Vec3, range: number) {
    this.set('lights', `color[${index}]`, { x: color.x, y: color.y, z: color.z, w: 2 })
    this.set('lights', `position[${index}]`, { x: position.x, y: position.y, z: position.z, w: range })
  }

  public setSpotLight(
    index: 0 | 1 | 2 | 3,
    color: Vec3,
    position: Vec3,
    direction: Vec3,
    range: number,
    angle: number,
  ) {
    // this.get(`lights.color[${index}]`).initFrom(color).setW
    // this.get(`lights.position[${index}]`).initFrom(position).setW(range)
    // this.get(`lights.direction[${index}]`).initFrom(direction).setW(angle)
  }

  public setLightDisabled(index: 0 | 1 | 2 | 3) {
    // this.get(`lights.color[${index}]`).setW(0)
  }
}
