import { DeviceGL } from '../webgl'
import { ViewportStateGL } from '../webgl/states'

describe('glib/graphics/ViewportState', () => {

  let device: DeviceGL
  let stateA: ViewportStateGL
  let stateB: ViewportStateGL
  let stateC: ViewportStateGL
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
    device = new DeviceGL()
    stateA = new ViewportStateGL(device).assign(paramsA)
    stateB = new ViewportStateGL(device).assign(paramsB)
    stateC = new ViewportStateGL(device)
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
