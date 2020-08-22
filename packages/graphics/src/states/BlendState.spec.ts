import {
  Blend,
  BlendFunction,
  DeviceGL,
} from '../index'
import { BlendStateGL } from '../webgl/states'
import { BlendStateParams } from './BlendState'

describe('glib/graphics/BlendState', () => {

  let device: DeviceGL
  let stateA: BlendStateGL
  let stateB: BlendStateGL
  let stateC: BlendStateGL
  let paramsA: BlendStateParams = {
    colorBlendFunction: BlendFunction.Add,
    alphaBlendFunction: BlendFunction.Subtract,

    colorSrcBlend: Blend.SrcColor,
    alphaSrcBlend: Blend.SrcAlpha,
    colorDstBlend: Blend.DstColor,
    alphaDstBlend: Blend.DstAlpha,

    constantR: 0.1,
    constantG: 0.2,
    constantB: 0.3,
    constantA: 0.4,
    enable: true,
  }
  let paramsB: BlendStateParams = {
    colorBlendFunction: BlendFunction.Subtract,
    alphaBlendFunction: BlendFunction.Add,

    colorSrcBlend: Blend.DstColor,
    alphaSrcBlend: Blend.DstAlpha,
    colorDstBlend: Blend.SrcColor,
    alphaDstBlend: Blend.SrcAlpha,

    constantR: 0.4,
    constantG: 0.3,
    constantB: 0.2,
    constantA: 0.1,
    enable: false,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new DeviceGL({ context: 'webgl' })
    stateA = new BlendStateGL(device).assign(paramsA)
    stateB = new BlendStateGL(device).assign(paramsB)
    stateC = new BlendStateGL(device)
  })

  describe(`get/set/change`, () => {
    beforeEach(() => {
      stateA.commit()
      stateC.resolve()
    })
    keys.forEach((key) => {
      it (`${key} is a getter`, () => {
        if (key === 'enable') {
          expect(stateA[key]).toBe(paramsA[key])
        } else {
          expect(stateA[key]).toBeCloseTo(paramsA[key])
        }
      })
      it (`${key} is a setter`, () => {
        stateA[key] = paramsB[key]
        expect(stateA[key]).toBeCloseTo(paramsB[key])
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
        if (key === 'enable') {
          expect(stateC[key]).toBe(paramsA[key])
        } else {
          expect(stateC[key]).toBeCloseTo(paramsA[key])
        }
      })
    })
  })
  describe(`commit paramsB int stateA resolve into stateC`, () => {
    keys.forEach((key) => {
      it(`resolves ${key}`, () => {
        stateA.commit(paramsB)
        stateC.resolve()
        if (key === 'enable') {
          expect(stateC[key]).toBe(paramsB[key])
        } else {
          expect(stateC[key]).toBeCloseTo(paramsB[key])
        }
      })
    })
  })
})
