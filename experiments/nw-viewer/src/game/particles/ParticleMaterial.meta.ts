import { inputSlot } from '@gglib/graphics'
export default {
  Tiles: inputSlot('material', 'tiles', 'vec4'),
  Lighting: inputSlot('material', 'lighting', 'vec4'),
  Options: inputSlot('material', 'options', 'vec4'),
  SamplerLinear: inputSlot('', 'samplerLinear', 'sampler'),
  SceneDepthMap: inputSlot('view', 'sceneDepthMap', 'texture'),
  DiffuseMap: inputSlot('', 'diffuseMap', 'texture'),
}