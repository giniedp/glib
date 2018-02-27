import { Events } from '@glib/core'

describe('@glib/core/Events', () => {
  let ev: Events
  let counter1 = 0
  let counter2 = 0
  let counter3 = 0
  let cb1 = () => counter1++
  let cb2 = () => counter2++
  let cb3 = () => counter3++

  beforeEach(() => {
    ev = new Events()
    counter1 = 0
    counter2 = 0
  })

  describe('on', () => {
    it('registeres and triggeres events', () => {
      ev.on('foo', cb1)
      ev.on('bar', cb2)
      ev.on('all', cb3)

      expect(counter1).toBe(0)
      ev.trigger('foo')
      expect(counter1).toBe(1)
      ev.trigger('foo')
      expect(counter1).toBe(2)

      expect(counter2).toBe(0)
      ev.trigger('bar')
      expect(counter2).toBe(1)
      ev.trigger('bar')
      expect(counter2).toBe(2)

      expect(counter3).toBe(4)
    })
  })

  describe('once', () => {
    it('registeres and triggeres events once', () => {
      ev.once('foo', cb1)
      ev.once('bar', cb2)

      expect(counter1).toBe(0)
      ev.trigger('foo')
      expect(counter1).toBe(1)
      ev.trigger('foo')
      expect(counter1).toBe(1)

      expect(counter2).toBe(0)
      ev.trigger('bar')
      expect(counter2).toBe(1)
      ev.trigger('bar')
      expect(counter2).toBe(1)
    })
  })

  describe('off', () => {
    it('removes all events', () => {
      ev.on('foo', cb1)
      ev.on('bar', cb2)
      ev.off()
      ev.trigger('foo')
      ev.trigger('bar')
      expect(counter1).toBe(0)
      expect(counter2).toBe(0)
    })
  })
})
