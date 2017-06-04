import {
  CullMode,
  CullState,
  Device,
  FrontFace,
} from '@glib/graphics'

describe('glib/graphics/CullState', () => {

  let device = new Device()
  let stateA: CullState
  let stateB: CullState
  let stateC: CullState
  let paramsA = {
    culling: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  }
  let paramsB = {
    culling: true,
    cullMode: CullMode.Front,
    frontFace: FrontFace.ClockWise,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    stateA = new CullState(device, paramsA)
    stateB = new CullState(device, stateB)
    stateC = new CullState(device)

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.culling).toBe(paramsA.culling)
      expect(stateC.cullMode).toBe(paramsA.cullMode)
      expect(stateC.frontFace).toBe(paramsA.frontFace)
      expect(stateC.isDirty).toBe(false)
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.culling).toBe(paramsB.culling)
      expect(stateC.cullMode).toBe(paramsB.cullMode)
      expect(stateC.frontFace).toBe(paramsB.frontFace)
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
