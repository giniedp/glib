import { CommonInputs, Device, inputSlotScalar, inputSlotTexture, materialSchemaClass, Texture } from '@gglib/graphics'
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

export interface SkyboxMaterialParams {
  cubemap: Texture
  intensity?: number
  blur?: number
}

export class SkyboxMaterial extends materialSchemaClass(SkyboxMaterialSchema) {
  public constructor(device: Device, options?: SkyboxMaterialParams) {
    super(device, {
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

    this.ViewProjection = Mat4.createIdentity()
    this.ObjectModel = Mat4.createIdentity()
    this.Intensity = options?.intensity ?? 1
    this.Blur = options?.blur ?? 0
    this.MipCount = options?.cubemap?.mipLevelCount ?? 4
    if (options?.cubemap) {
      this.EnvironmentMap = options.cubemap
    }
  }
}
