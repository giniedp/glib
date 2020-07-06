import { DeviceGL } from '../webgl'
import { OffsetStateGL } from '../webgl/states'
import { OffsetStateParams } from './OffsetState'

describe('glib/graphics/OffsetState', () => {

  let device: DeviceGL
  let stateA: OffsetStateGL
  let stateB: OffsetStateGL
  let stateC: OffsetStateGL
  let paramsA: OffsetStateParams = {
    enable: false,
    offsetFactor: 1,
    offsetUnits: 2,
  }
  let paramsB: OffsetStateParams = {
    enable: true,
    offsetFactor: 3,
    offsetUnits: 4,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new DeviceGL()
    stateA = new OffsetStateGL(device).assign(paramsA)
    stateB = new OffsetStateGL(device).assign(paramsB)
    stateC = new OffsetStateGL(device)
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
