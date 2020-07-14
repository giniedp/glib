
import { forwardRef } from './forwardRef'
import { getInjectMetadata, Inject } from './Inject'

class A {
  @Inject(forwardRef(() => B), { from: 'foo', optional: true })
  public b: B
}

class B {

}

class C {
  @Inject(B)
  public b: B
}

describe('@gglib/ecs/Inject', () => {

  it('annotates with metadata', () => {

    const metaOfA = getInjectMetadata(new A())
    expect(metaOfA).toBeDefined()
    expect(metaOfA.has('b')).toBe(true)
    expect(metaOfA.get('b').property).toBe('b')
    expect(metaOfA.get('b').service).toBe(B)
    expect(metaOfA.get('b').from).toBe('foo')
    expect(metaOfA.get('b').optional).toBe(true)

    const metaOfC = getInjectMetadata(new C())
    expect(metaOfC).toBeDefined()
    expect(metaOfC.has('b')).toBe(true)
    expect(metaOfC.get('b').property).toBe('b')
    expect(metaOfC.get('b').service).toBe(B)
    expect(metaOfC.get('b').from).toBe('')
    expect(metaOfC.get('b').optional).toBe(false)
  })

})
