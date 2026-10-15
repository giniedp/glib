import { inputSlot } from '@gglib/graphics'
export default {
  Tiles: inputSlot('material', 'tiles', 'vec4'),
  Lighting: inputSlot('material', 'lighting', 'vec4'),
  Options: inputSlot('material', 'options', 'vec4'),
  DiffuseColor: inputSlot('material', 'diffusecolor', 'vec4'),
  Sdf0: inputSlot('material', 'sdf0', 'vec4'),
  Sdf1: inputSlot('material', 'sdf1', 'vec4'),
  Sdf2: inputSlot('material', 'sdf2', 'vec4'),
  Sdf3: inputSlot('material', 'sdf3', 'vec4'),
  SamplerLinear: inputSlot('', 'samplerLinear', 'sampler'),
  SamplerWrap: inputSlot('', 'samplerWrap', 'sampler'),
  SceneDepthMap: inputSlot('view', 'sceneDepthMap', 'texture'),
  DiffuseMap: inputSlot('', 'diffuseMap', 'texture'),
  SdfNoiseMap: inputSlot('', 'sdfNoiseMap', 'texture'),
  SdfMaskMap: inputSlot('', 'sdfMaskMap', 'texture'),
}