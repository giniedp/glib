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

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.enable).toBe(paramsA.enable)
      expect(stateC.stencilFunction).toBe(paramsA.stencilFunction)
      expect(stateC.stencilReference).toBe(paramsA.stencilReference)
      expect(stateC.stencilMask).toBe(paramsA.stencilMask)

      expect(stateC.stencilFail).toBe(paramsA.stencilFail)
      expect(stateC.stencilDepthFail).toBe(paramsA.stencilDepthFail)
      expect(stateC.stencilDepthPass).toBe(paramsA.stencilDepthPass)

      expect(stateC.stencilBackFunction).toBe(paramsA.stencilBackFunction)
      expect(stateC.stencilBackReference).toBe(paramsA.stencilBackReference)
      expect(stateC.stencilBackMask).toBe(paramsA.stencilBackMask)

      expect(stateC.stencilBackFail).toBe(paramsA.stencilBackFail)
      expect(stateC.stencilBackDepthFail).toBe(paramsA.stencilBackDepthFail)
      expect(stateC.stencilBackDepthPass).toBe(paramsA.stencilBackDepthPass)

      expect(stateC.isDirty).toBe(false)
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.enable).toBe(paramsB.enable)
      expect(stateC.stencilFunction).toBe(paramsB.stencilFunction)
      expect(stateC.stencilReference).toBe(paramsB.stencilReference)
      expect(stateC.stencilMask).toBe(paramsB.stencilMask)

      expect(stateC.stencilFail).toBe(paramsB.stencilFail)
      expect(stateC.stencilDepthFail).toBe(paramsB.stencilDepthFail)
      expect(stateC.stencilDepthPass).toBe(paramsB.stencilDepthPass)

      expect(stateC.stencilBackFunction).toBe(paramsB.stencilBackFunction)
      expect(stateC.stencilBackReference).toBe(paramsB.stencilBackReference)
      expect(stateC.stencilBackMask).toBe(paramsB.stencilBackMask)

      expect(stateC.stencilBackFail).toBe(paramsB.stencilBackFail)
      expect(stateC.stencilBackDepthFail).toBe(paramsB.stencilBackDepthFail)
      expect(stateC.stencilBackDepthPass).toBe(paramsB.stencilBackDepthPass)

      expect(stateC.isDirty).toBe(false)

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
