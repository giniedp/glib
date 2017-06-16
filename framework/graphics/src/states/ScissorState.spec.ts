import {
  Device,
  ScissorState,
} from '@glib/graphics'

describe('glib/graphics/ScissorState', () => {

  let device: Device
  let stateA: ScissorState
  let stateB: ScissorState
  let stateC: ScissorState
  let paramsA = {
    enable: false,
    x: 1,
    y: 2,
    width: 3,
    height: 4,
  }
  let paramsB = {
    enable: true,
    x: 5,
    y: 6,
    width: 7,
    height: 8,
  }

  let keys = Object.keys(paramsA)

  beforeEach(() => {
    device = new Device()
    stateA = new ScissorState(device, paramsA)
    stateB = new ScissorState(device, stateB)
    stateC = new ScissorState(device)

    stateA.commit()
    stateC.resolve()
  })

  describe('commit/resolve', () => {
    it('own state', () => {
      stateA.commit()
      stateC.resolve()

      expect(stateC.enable).toBe(paramsA.enable)
      expect(stateC.x).toBe(paramsA.x)
      expect(stateC.y).toBe(paramsA.y)
      expect(stateC.width).toBe(paramsA.width)
      expect(stateC.height).toBe(paramsA.height)
      expect(stateC.isDirty).toBe(false)
    })

    it('given state', () => {
      stateA.commit(paramsB)
      stateC.resolve()

      expect(stateC.enable).toBe(paramsB.enable)
      expect(stateC.x).toBe(paramsB.x)
      expect(stateC.y).toBe(paramsB.y)
      expect(stateC.width).toBe(paramsB.width)
      expect(stateC.height).toBe(paramsB.height)
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
