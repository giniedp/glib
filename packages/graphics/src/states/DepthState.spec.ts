import {
  CompareFunction,
} from '../index'
import { DeviceGL } from '../webgl'
import { DepthStateGL } from '../webgl/states'
import { DepthStateParams } from './DepthState'

describe('glib/graphics/DepthState', () => {

  let device: DeviceGL
  let stateA: DepthStateGL
  let stateB: DepthStateGL
  let stateC: DepthStateGL
  let paramsA: DepthStateParams = {
    enable: true,
    depthFunction: CompareFunction.Always,
    depthWriteEnable: false,
  }
  let paramsB: DepthStateParams = {
    enable: false,
    depthFunction: CompareFunction.Never,
    depthWriteEnable: true,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new DeviceGL()
    stateA = new DepthStateGL(device).assign(paramsA)
    stateB = new DepthStateGL(device).assign(paramsB)
    stateC = new DepthStateGL(device)
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
  describe(`commit stateA resolve into stateC`, () => {
    keys.forEach((key) => {
      it(`resolves ${key}`, () => {
        stateA.commit(paramsB)
        stateC.resolve()
        expect(stateC[key]).toBe(paramsB[key])
      })
    })
  })
})
