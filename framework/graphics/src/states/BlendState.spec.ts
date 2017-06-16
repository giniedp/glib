import {
  Blend,
  BlendFunction,
  BlendState,
  Device,
} from '@glib/graphics'

describe('glib/graphics/BlendState', () => {

  let device: Device
  let stateA: BlendState
  let stateB: BlendState
  let stateC: BlendState
  let paramsA = {
    colorBlendFunction: BlendFunction.Add,
    alphaBlendFunction: BlendFunction.Subtract,

    colorSrcBlend: Blend.SrcColor,
    alphaSrcBlend: Blend.SrcAlpha,
    colorDstBlend: Blend.DstColor,
    alphaDstBlend: Blend.DstAlpha,

    constantR: 1,
    constantG: 2,
    constantB: 3,
    constantA: 4,
    enabled: true,
  }
  let paramsB = {
    colorBlendFunction: BlendFunction.Subtract,
    alphaBlendFunction: BlendFunction.Add,

    colorSrcBlend: Blend.DstColor,
    alphaSrcBlend: Blend.DstAlpha,
    colorDstBlend: Blend.SrcColor,
    alphaDstBlend: Blend.SrcAlpha,

    constantR: 4,
    constantG: 3,
    constantB: 2,
    constantA: 1,
    enabled: false,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device({ context: 'webgl' })
    stateA = new BlendState(device, paramsA)
    stateB = new BlendState(device, stateB)
    stateC = new BlendState(device)
  })

  describe(`get/set/change`, () => {
    beforeEach(() => {
      stateA.commit()
      stateC.resolve()
    })
    keys.forEach((key) => {
      it (`${key} is a getter`, () => {
        expect(stateA[key]).toBe(paramsA[key])
      })
      it (`${key} is a setter`, () => {
        stateA[key] = paramsB[key]
        expect(stateA[key]).toBe(paramsB[key])
      })
      it (`${key} marks state as changed`, () => {
        expect(stateC.isDirty).toBe(false)
        stateC[key] = paramsB[key]
        expect(stateC.isDirty).toBe(true)
      })
    })
  })
  describe(`commit stateA resolve into stateC`, () => {
    keys.forEach((key) => {
      it(`resolves ${key}`, () => {
        stateA.commit()
        stateC.resolve()
        expect(stateC[key]).toBe(paramsA[key])
      })
    })
  })
  describe(`commit paramsB int stateA resolve into stateC`, () => {
    keys.forEach((key) => {
      it(`resolves ${key}`, () => {
        stateA.commit(paramsB)
        stateC.resolve()
        expect(stateC[key]).toBe(paramsB[key])
      })
    })
  })
})
