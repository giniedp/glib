import {
  Device,
  ViewportState,
} from '@glib/graphics'

describe('glib/graphics/ViewportState', () => {

  let device = new Device()
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
    stateA = new ViewportState(device, paramsA)
    stateB = new ViewportState(device, stateB)
    stateC = new ViewportState(device)

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.x).toBe(paramsA.x)
      expect(stateC.y).toBe(paramsA.y)
      expect(stateC.width).toBe(paramsA.width)
      expect(stateC.height).toBe(paramsA.height)
      expect(stateC.zMin).toBeCloseTo(paramsA.zMin)
      expect(stateC.zMax).toBeCloseTo(paramsA.zMax)
      expect(stateC.isDirty).toBe(false)
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.x).toBe(paramsB.x)
      expect(stateC.y).toBe(paramsB.y)
      expect(stateC.width).toBe(paramsB.width)
      expect(stateC.height).toBe(paramsB.height)
      expect(stateC.zMin).toBeCloseTo(paramsB.zMin)
      expect(stateC.zMax).toBeCloseTo(paramsB.zMax)
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
