import {
  CompareFunction,
  DepthState,
  Device,
} from '@gglib/graphics'

describe('glib/graphics/DepthState', () => {

  let device: Device
  let stateA: DepthState
  let stateB: DepthState
  let stateC: DepthState
  let paramsA = {
    depthEnable: true,
    depthFunction: CompareFunction.Always,
    depthWriteEnable: false,
  }
  let paramsB = {
    depthEnable: false,
    depthFunction: CompareFunction.Never,
    depthWriteEnable: true,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device()
    stateA = new DepthState(device, paramsA)
    stateB = new DepthState(device, stateB)
    stateC = new DepthState(device)
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
