import {
  CompareFunction,
  Device,
  StencilOperation,
  StencilState,
} from '@glib/graphics'

describe('glib/graphics/StencilState', () => {

  let device: Device
  let stateA: StencilState
  let stateB: StencilState
  let stateC: StencilState
  let paramsA = {
    enable: false,

    // front face stencil
    stencilFunction: CompareFunction.Never,
    stencilReference: 1,
    stencilMask: 0xffffff00,

    stencilFail: StencilOperation.Decrement,
    stencilDepthFail: StencilOperation.Increment,
    stencilDepthPass: StencilOperation.Invert,

    // back face stencil
    stencilBackFunction: CompareFunction.Never,
    stencilBackReference: 2,
    stencilBackMask: 0x00ffffff,

    stencilBackFail: StencilOperation.Keep,
    stencilBackDepthFail: StencilOperation.Replace,
    stencilBackDepthPass: StencilOperation.Zero,
  }
  let paramsB = {
    enable: true,

    // front face stencil
    stencilFunction: CompareFunction.Always,
    stencilReference: 3,
    stencilMask: 0xffff00ff,

    stencilFail: StencilOperation.Increment,
    stencilDepthFail: StencilOperation.Invert,
    stencilDepthPass: StencilOperation.Decrement,

    // back face stencil
    stencilBackFunction: CompareFunction.Equal,
    stencilBackReference: 4,
    stencilBackMask: 0xff00ffff,

    stencilBackFail: StencilOperation.DecrementWrap,
    stencilBackDepthFail: StencilOperation.IncrementWrap,
    stencilBackDepthPass: StencilOperation.Replace,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device({ contextAttributes: { depth: true, stencil: true} })
    stateA = new StencilState(device, paramsA)
    stateB = new StencilState(device, stateB)
    stateC = new StencilState(device)
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
