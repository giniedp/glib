import {
  Device,
  ViewportState,
} from '@glib/graphics'

describe('glib/graphics/ViewportState', () => {

  let device: Device
  let stateA: ViewportState
  let stateB: ViewportState
  let stateC: ViewportState
  let paramsA = {
    x: 1,
    y: 2,
    width: 3,
    height: 4,
    zMin: 0.1,
    zMax: 0.2,
  }
  let paramsB = {
    x: 7,
    y: 8,
    width: 9,
    height: 10,
    zMin: 0.3,
    zMax: 0.4,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device()
    stateA = new ViewportState(device, paramsA)
    stateB = new ViewportState(device, stateB)
    stateC = new ViewportState(device)
  })
  describe(`get/set/change`, () => {
    beforeEach(() => {
      stateA.commit()
      stateC.resolve()
    })
    keys.forEach((key) => {
      it (`${key} is a getter`, () => {
        expect(stateA[key]).toBeCloseTo(paramsA[key])
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
        expect(stateC[key]).toBeCloseTo(paramsA[key])
      })
    })
  })
  describe(`commit paramsB int stateA resolve into stateC`, () => {
    keys.forEach((key) => {
      it(`resolves ${key}`, () => {
        stateA.commit(paramsB)
        stateC.resolve()
        expect(stateC[key]).toBeCloseTo(paramsB[key])
      })
    })
  })
})
