import {
  Device,
  OffsetState,
} from '@glib/graphics'

describe('glib/graphics/OffsetState', () => {

  let device = new Device()
  let stateA: OffsetState
  let stateB: OffsetState
  let stateC: OffsetState
  let paramsA = {
    offsetEnable: false,
    offsetFactor: 1,
    offsetUnits: 2,
  }
  let paramsB = {
    offsetEnable: true,
    offsetFactor: 3,
    offsetUnits: 4,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    stateA = new OffsetState(device, paramsA)
    stateB = new OffsetState(device, stateB)
    stateC = new OffsetState(device)

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.offsetEnable).toBe(paramsA.offsetEnable)
      expect(stateC.offsetFactor).toBe(paramsA.offsetFactor)
      expect(stateC.offsetUnits).toBe(paramsA.offsetUnits)
      expect(stateC.isDirty).toBe(false)
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.offsetEnable).toBe(paramsB.offsetEnable)
      expect(stateC.offsetFactor).toBe(paramsB.offsetFactor)
      expect(stateC.offsetUnits).toBe(paramsB.offsetUnits)
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
