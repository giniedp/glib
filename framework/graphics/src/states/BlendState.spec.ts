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

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.colorBlendFunction).toBe(paramsA.colorBlendFunction, 'colorBlendFunction')
      expect(stateC.alphaBlendFunction).toBe(paramsA.alphaBlendFunction, 'alphaBlendFunction')

      expect(stateC.colorSrcBlend).toBe(paramsA.colorSrcBlend, 'colorSrcBlend')
      expect(stateC.alphaSrcBlend).toBe(paramsA.alphaSrcBlend, 'alphaSrcBlend')
      expect(stateC.colorDstBlend).toBe(paramsA.colorDstBlend, 'colorDstBlend')
      expect(stateC.alphaDstBlend).toBe(paramsA.alphaDstBlend, 'alphaDstBlend')

      expect(stateC.constantR).toBe(paramsA.constantR, 'constantR')
      expect(stateC.constantG).toBe(paramsA.constantG, 'constantG')
      expect(stateC.constantB).toBe(paramsA.constantB, 'constantB')
      expect(stateC.constantA).toBe(paramsA.constantA, 'constantA')

      expect(stateC.enabled).toBe(paramsA.enabled, 'enabled')

      expect(stateC.isDirty).toBe(false, 'isDirty')
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.colorBlendFunction).toBe(paramsB.colorBlendFunction, 'colorBlendFunction')
      expect(stateC.alphaBlendFunction).toBe(paramsB.alphaBlendFunction, 'alphaBlendFunction')

      expect(stateC.colorSrcBlend).toBe(paramsB.colorSrcBlend, 'colorSrcBlend')
      expect(stateC.alphaSrcBlend).toBe(paramsB.alphaSrcBlend, 'alphaSrcBlend')
      expect(stateC.colorDstBlend).toBe(paramsB.colorDstBlend, 'colorDstBlend')
      expect(stateC.alphaDstBlend).toBe(paramsB.alphaDstBlend, 'alphaDstBlend')

      expect(stateC.constantR).toBe(paramsB.constantR, 'constantR')
      expect(stateC.constantG).toBe(paramsB.constantG, 'constantG')
      expect(stateC.constantB).toBe(paramsB.constantB, 'constantB')
      expect(stateC.constantA).toBe(paramsB.constantA, 'constantA')

      expect(stateC.enabled).toBe(paramsB.enabled, 'enabled')

      expect(stateC.isDirty).toBe(false, 'isDirty')
    })
  })

  keys.forEach((key) => {
    describe(key, () => {
      it ('is a getter', () => {
        expect(stateA[key]).toBe(paramsA[key])
      })
      it ('is a setter', () => {
        stateA[key] = paramsB[key]
        expect(stateA[key]).toBe(paramsB[key])
      })
      it ('marks as changed', () => {
        expect(stateC.isDirty).toBe(false)
        stateC[key] = paramsB[key]
        expect(stateC.isDirty).toBe(true)
      })
    })
  })
})
