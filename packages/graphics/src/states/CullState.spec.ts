import {
  CullMode,
  Device,
  DeviceGL,
  FrontFace,
} from '@gglib/graphics'
import { CullStateGL } from '../webgl/states'
import { CullStateParams } from './CullState'

describe('glib/graphics/CullState', () => {

  let device: DeviceGL
  let stateA: CullStateGL
  let stateB: CullStateGL
  let stateC: CullStateGL
  let paramsA: CullStateParams = {
    enable: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  }
  let paramsB: CullStateParams = {
    enable: true,
    cullMode: CullMode.Front,
    frontFace: FrontFace.ClockWise,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new DeviceGL()
    stateA = new CullStateGL(device).assign(paramsA)
    stateB = new CullStateGL(device).assign(paramsB)
    stateC = new CullStateGL(device)
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
