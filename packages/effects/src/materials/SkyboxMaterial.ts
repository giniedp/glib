import {
  CommonInputs,
  Device,
  inputSlotScalar,
  inputSlotTexture,
  MaterialOptions,
  MaterialWithSchema,
  Texture,
} from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { SKYBOX_GLSL_FS, SKYBOX_GLSL_VS } from './SkyboxMaterial.glsl'
import { SKYBOX_WGSL } from './SkyboxMaterial.wgsl'

export const SkyboxMaterialSchema = {
  ViewProjection: CommonInputs.View.ViewProjectionMatrix,
  ObjectModel: CommonInputs.Object.ModelMatrix,
  Intensity: inputSlotScalar('material', 'intensity'),
  Blur: inputSlotScalar('material', 'blur'),
  MipCount: inputSlotScalar('material', 'mipCount'),
  EnvironmentMap: inputSlotTexture('material', 'environmentMap'),
}

export type SkyboxMaterialParams = {
  cubemap: Texture
  intensity?: number
  blur?: number
}

export function skyboxMaterial(device: Device, params?: SkyboxMaterialParams) {
  return new SkyboxMaterial(device, {
    properties: params,
  })
}

export class SkyboxMaterial extends MaterialWithSchema(SkyboxMaterialSchema) {
  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Skybox Material',
      effect: {
        name: 'Skybox Effect',
        program: {
          sharedBlocks: [],
          shader: {
            name: 'Skybox Shader',
            wgsl: { source: SKYBOX_WGSL },
            glsl: { vertex: SKYBOX_GLSL_VS, fragment: SKYBOX_GLSL_FS },
          },
        },
      },
    })

    const params = options?.properties as SkyboxMaterialParams
    this.ViewProjection = Mat4.createIdentity()
    this.ObjectModel = Mat4.createIdentity()
    this.Intensity = params.intensity ?? 1
    this.Blur = params.blur ?? 0
    this.MipCount = params.cubemap?.mipLevelCount ?? 4
    if (params.cubemap) {
      this.EnvironmentMap = params.cubemap
    }
  }
}
