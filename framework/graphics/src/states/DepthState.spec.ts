import {
  CompareFunction,
  DepthState,
  Device,
} from '@glib/graphics'

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

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.depthEnable).toBe(paramsA.depthEnable)
      expect(stateC.depthFunction).toBe(paramsA.depthFunction)
      expect(stateC.depthWriteEnable).toBe(paramsA.depthWriteEnable)
      expect(stateC.isDirty).toBe(false)
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.depthEnable).toBe(paramsB.depthEnable)
      expect(stateC.depthFunction).toBe(paramsB.depthFunction)
      expect(stateC.depthWriteEnable).toBe(paramsB.depthWriteEnable)
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
