import { Entity } from '../Entity'
import { Query } from './query'

describe('@gglib/ecs/query', () => {
  let root: Entity
  let A: Entity
  let B: Entity
  let C: Entity
  let D: Entity
  let E: Entity
  let F: Entity
  let G: Entity
  let query = new Query()

  //
  //       A
  //      / \
  //     B   C
  //    /|   |\
  //   D E   F G
  //

  beforeAll(() => {
    root = Entity.createRoot().tap((eA) => {
      A = eA

      eA.name = 'A'
      eA.createChild((eB) => {
        B = eB

        eB.name = 'B'
        eB.createChild((e) => {
          D = e

          e.name = 'D'
        })
        eB.createChild((e) => {
          E = e

          e.name = 'E'
        })
      })

      eA.createChild((eC) => {
        C = eC

        eC.name = 'C'
        eC.createChild((e) => {
          F = e

          e.name = 'F'
        })
        eC.createChild((e) => {
          G = e

          e.name = 'G'
        })
      })
    })
  })

  it('/', () => {
    expect(query.findOne(root, '/')).toBe(A)
    expect(query.findOne(A, '/')).toBe(root)
    expect(query.findOne(B, '/')).toBe(root)
    expect(query.findOne(C, '/')).toBe(root)
    expect(query.findOne(D, '/')).toBe(root)
    expect(query.findOne(E, '/')).toBe(root)
    expect(query.findOne(F, '/')).toBe(root)
    expect(query.findOne(G, '/')).toBe(root)
  })

  it('./', () => {
    expect(query.findOne(A, './')).toBe(A)
    expect(query.findOne(B, './')).toBe(B)
    expect(query.findOne(C, './')).toBe(C)
    expect(query.findOne(D, './')).toBe(D)
    expect(query.findOne(E, './')).toBe(E)
    expect(query.findOne(F, './')).toBe(F)
    expect(query.findOne(G, './')).toBe(G)
  })

  it('../', () => {
    expect(query.findOne(A, '../')).toBe(null)
    expect(query.findOne(B, '../')).toBe(A)
    expect(query.findOne(C, '../')).toBe(A)
    expect(query.findOne(D, '../')).toBe(B)
    expect(query.findOne(E, '../')).toBe(B)
    expect(query.findOne(F, '../')).toBe(C)
    expect(query.findOne(G, '../')).toBe(C)
  })

  it('*/', () => {
    expect(query.findOne(A, '*/')).toBe(B)
    expect(query.findAll(A, '*/')).toEqual([B, C])
    expect(query.findAll(A, '*')).toEqual([B, C])

    expect(query.findOne(B, '*/')).toBe(D)
    expect(query.findAll(B, '*/')).toEqual([D, E])
    expect(query.findAll(B, '*')).toEqual([D, E])

    expect(query.findOne(C, '*/')).toBe(F)
    expect(query.findAll(C, '*/')).toEqual([F, G])
    expect(query.findAll(C, '*')).toEqual([F, G])
  })

  it('**/', () => {
    expect(query.findOne(A, '**/')).toBe(A)
    expect(query.findAll(A, '**/')).toEqual([A, B, D, E, C, F, G])
    expect(query.findAll(A, '**')).toEqual([A, B, D, E, C, F, G])

    expect(query.findOne(B, '**/')).toBe(B)
    expect(query.findAll(B, '**/')).toEqual([B, D, E])
    expect(query.findAll(B, '**')).toEqual([B, D, E])
  })

  it('finds entities by name', () => {
    expect(query.findOne(A, 'A')).toBe(null)
    expect(query.findOne(A, 'B')).toBe(B)
    expect(query.findOne(A, 'C')).toBe(C)
    expect(query.findOne(A, 'D')).toBe(null)
    expect(query.findOne(A, 'E')).toBe(null)
    expect(query.findOne(A, 'F')).toBe(null)
    expect(query.findOne(A, 'G')).toBe(null)

    expect(query.findOne(A, './A')).toBe(null)
    expect(query.findOne(A, './B')).toBe(B)
    expect(query.findOne(A, './C')).toBe(C)
    expect(query.findOne(A, './D')).toBe(null)
    expect(query.findOne(A, './E')).toBe(null)
    expect(query.findOne(A, './F')).toBe(null)
    expect(query.findOne(A, './G')).toBe(null)

    expect(query.findOne(A, '*/A')).toBe(null)
    expect(query.findOne(A, '*/B')).toBe(null)
    expect(query.findOne(A, '*/C')).toBe(null)
    expect(query.findOne(A, '*/D')).toBe(D)
    expect(query.findOne(A, '*/E')).toBe(E)
    expect(query.findOne(A, '*/F')).toBe(F)
    expect(query.findOne(A, '*/G')).toBe(G)

    expect(query.findOne(A, '**/A')).toBe(null)
    expect(query.findOne(A, '**/B')).toBe(B)
    expect(query.findOne(A, '**/C')).toBe(C)
    expect(query.findOne(A, '**/D')).toBe(D)
    expect(query.findOne(A, '**/E')).toBe(E)
    expect(query.findOne(A, '**/F')).toBe(F)
    expect(query.findOne(A, '**/G')).toBe(G)

    expect(query.findOne(A, '**/G')).toBe(G)
    expect(query.findAll(A, '**/G')).toEqual([G])
  })
})
