import { Vec2 } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { inputAccessor, typedInputAccessor } from './ProgramInputAccessor'

describe('typedParams', () => {
  let params: { foo: number; bar: Vec2 }

  beforeEach(() => {
    params = { foo: 42, bar: Vec2.create(1, 2) }
  })

  describe('get()', () => {
    it('is defined', () => {
      const typed = typedInputAccessor(params)
      expect(typed.get).toBeTypeOf('function')
    })
    it('gets value', () => {
      const typed = typedInputAccessor(params)
      expect(typed.get('foo')).toBe(42)
      typed['foo'] = 100
      expect(typed.get('foo')).toBe(100)
    })

    it('is not enumerable', () => {
      const typed = typedInputAccessor(params)
      expect(Object.keys(typed)).not.toContain('get')
      expect('get' in typed).toBe(true)
    })
  })

  describe('set()', () => {
    it('is defined', () => {
      const typed = typedInputAccessor(params)
      expect(typed.set).toBeTypeOf('function')
    })
    it('sets value', () => {
      const typed = typedInputAccessor(params)
      typed.set('foo', 100)
      expect(typed.foo).toBe(100)
    })

    it('is not enumerable', () => {
      const typed = typedInputAccessor(params)
      expect(Object.keys(typed)).not.toContain('set')
      expect('set' in typed).toBe(true)
    })
  })
})
