import { DeviceGL } from '../webgl'
import { ScissorStateGL } from '../webgl/states'
import { ScissorStateParams } from './ScissorState'

describe('glib/graphics/ScissorState', () => {

  let device: DeviceGL
  let stateA: ScissorStateGL
  let stateB: ScissorStateGL
  let stateC: ScissorStateGL
  let paramsA: ScissorStateParams = {
    enable: false,
    x: 1,
    y: 2,
    width: 3,
    height: 4,
  }
  let paramsB: ScissorStateParams = {
    enable: true,
    x: 5,
    y: 6,
    width: 7,
    height: 8,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new DeviceGL()
    stateA = new ScissorStateGL(device).assign(paramsA)
    stateB = new ScissorStateGL(device).assign(paramsB)
    stateC = new ScissorStateGL(device)
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
