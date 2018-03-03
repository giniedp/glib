import {
  Device,
  ScissorState,
} from '@gglib/graphics'

describe('glib/graphics/ScissorState', () => {

  let device: Device
  let stateA: ScissorState
  let stateB: ScissorState
  let stateC: ScissorState
  let paramsA = {
    enable: false,
    x: 1,
    y: 2,
    width: 3,
    height: 4,
  }
  let paramsB = {
    enable: true,
    x: 5,
    y: 6,
    width: 7,
    height: 8,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device()
    stateA = new ScissorState(device, paramsA)
    stateB = new ScissorState(device, stateB)
    stateC = new ScissorState(device)
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
