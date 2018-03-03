import {
  CullMode,
  CullState,
  Device,
  FrontFace,
} from '@gglib/graphics'

describe('glib/graphics/CullState', () => {

  let device: Device
  let stateA: CullState
  let stateB: CullState
  let stateC: CullState
  let paramsA = {
    culling: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  }
  let paramsB = {
    culling: true,
    cullMode: CullMode.Front,
    frontFace: FrontFace.ClockWise,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device()
    stateA = new CullState(device, paramsA)
    stateB = new CullState(device, stateB)
    stateC = new CullState(device)
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
