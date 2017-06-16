import { OBJ } from '@glib/content/src/parser'

describe('glib/content/parser/OBJ', () => {
  it('parses obj file', () => {
    const result = OBJ.parse(`
# cube.obj
#

g cube

v  0.0  0.0  0.0
v  0.0  0.0  1.0
v  0.0  1.0  0.0
v  0.0  1.0  1.0
v  1.0  0.0  0.0
v  1.0  0.0  1.0
v  1.0  1.0  0.0
v  1.0  1.0  1.0

vn  0.0  0.0  1.0
vn  0.0  0.0 -1.0
vn  0.0  1.0  0.0
vn  0.0 -1.0  0.0
vn  1.0  0.0  0.0
vn -1.0  0.0  0.0

f  1//2  7//2  5//2
f  1//2  3//2  7//2
f  1//6  4//6  3//6
f  1//6  2//6  4//6
f  3//3  8//3  7//3
f  3//3  4//3  8//3
f  5//5  7//5  8//5
f  5//5  8//5  6//5
f  1//4  5//4  6//4
f  1//4  6//4  2//4
f  2//1  6//1  8//1
f  2//1  8//1  4//1
    `)

    expect(result.v.length).toBe(8)
    expect(result.v[0]).toEqual([0, 0, 0])
    expect(result.v[1]).toEqual([0, 0, 1])
    expect(result.v[2]).toEqual([0, 1, 0])
    expect(result.v[3]).toEqual([0, 1, 1])
    expect(result.v[4]).toEqual([1, 0, 0])
    expect(result.v[5]).toEqual([1, 0, 1])
    expect(result.v[6]).toEqual([1, 1, 0])
    expect(result.v[7]).toEqual([1, 1, 1])

    expect(result.vn.length).toBe(6)
    expect(result.vn[0]).toEqual([ 0.0,  0.0,  1.0])
    expect(result.vn[1]).toEqual([ 0.0,  0.0, -1.0])
    expect(result.vn[2]).toEqual([ 0.0,  1.0,  0.0])
    expect(result.vn[3]).toEqual([ 0.0, -1.0,  0.0])
    expect(result.vn[4]).toEqual([ 1.0,  0.0,  0.0])
    expect(result.vn[5]).toEqual([-1.0,  0.0,  0.0])

    expect(result.groups.length).toBe(1)
    expect(result.groups[0].name).toBe('cube')
    expect(result.groups[0].f.length).toBe(12)
  })
})
