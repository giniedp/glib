import { Entity } from '../Entity'
import { TimeComponent } from './TimeComponent'

describe('@gglib/ecs/TimeComponent', () => {

  let entity: Entity
  let component: TimeComponent
  let mockedRealTime = 0

  beforeEach(() => {
    component = new TimeComponent({ getTime: () => mockedRealTime })
    entity = Entity.createRoot().addComponent(component)
    mockedRealTime = 0
    entity.initializeComponents(true)
  })

  it ('accumulates game time', () => {
    entity.updateComponents(16, true)
    expect(component.game.elapsedMs).toBe(16)
    expect(component.game.totalMs).toBe(16)
    entity.updateComponents(16, true)
    expect(component.game.elapsedMs).toBe(16)
    expect(component.game.totalMs).toBe(32)
    entity.updateComponents(8, true)
    expect(component.game.elapsedMs).toBe(8)
    expect(component.game.totalMs).toBe(40)

    // draw times are tracked individually

    entity.drawComponents(32, true)
    expect(component.game.elapsedMs).toBe(32)
    expect(component.game.totalMs).toBe(32)
    entity.drawComponents(16, true)
    expect(component.game.elapsedMs).toBe(16)
    expect(component.game.totalMs).toBe(48)
  })

  it ('accumulates real time', () => {
    mockedRealTime = 16
    entity.updateComponents(0, true)
    expect(component.real.elapsedMs).toBe(16)
    expect(component.real.totalMs).toBe(16)
    mockedRealTime += 16
    entity.updateComponents(0, true)
    expect(component.real.elapsedMs).toBe(16)
    expect(component.real.totalMs).toBe(32)
    mockedRealTime += 8
    entity.updateComponents(0, true)
    expect(component.real.elapsedMs).toBe(8)
    expect(component.real.totalMs).toBe(40)

    // draw times are tracked individually

    entity.drawComponents(0, true)
    expect(component.real.elapsedMs).toBe(40)
    expect(component.real.totalMs).toBe(40)

    mockedRealTime += 8
    entity.drawComponents(0, true)
    expect(component.real.elapsedMs).toBe(8)
    expect(component.real.totalMs).toBe(48)
  })
})
