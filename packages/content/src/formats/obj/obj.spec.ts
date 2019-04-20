import { OBJ } from './obj'

describe('content/formats/obj', () => {
  describe('Square', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v 0.000000 2.000000 0.000000
        v 0.000000 0.000000 0.000000
        v 2.000000 0.000000 0.000000
        v 2.000000 2.000000 0.000000
        f 1 2 3 4
      `)

      expect(result.v.length).toBe(4)
      expect(result.v[0]).toEqual([0, 2, 0])
      expect(result.v[1]).toEqual([0, 0, 0])
      expect(result.v[2]).toEqual([2, 0, 0])
      expect(result.v[3]).toEqual([2, 2, 0])

      expect(result.f.length).toBe(1)
      expect(result.f[0].type).toBe('f')
      expect(result.f[0].group).toBeDefined()
      expect(result.f[0].data).toEqual([{ v: 0 }, { v: 1 }, { v: 2 }, { v: 3 }])
    })
  })

  describe('Cube', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v 0.000000 2.000000 2.000000
        v 0.000000 0.000000 2.000000
        v 2.000000 0.000000 2.000000
        v 2.000000 2.000000 2.000000
        v 0.000000 2.000000 0.000000
        v 0.000000 0.000000 0.000000
        v 2.000000 0.000000 0.000000
        v 2.000000 2.000000 0.000000
        f 1 2 3 4
        f 8 7 6 5
        f 4 3 7 8
        f 5 1 4 8
        f 5 6 2 1
        f 2 6 7 3
      `)

      expect(result.v).toEqual([
        [0, 2, 2],
        [0, 0, 2],
        [2, 0, 2],
        [2, 2, 2],
        [0, 2, 0],
        [0, 0, 0],
        [2, 0, 0],
        [2, 2, 0],
      ])

      expect(result.f.length).toBe(6)
      expect(result.f[0].data).toEqual([{ v: 0 }, { v: 1 }, { v: 2 }, { v: 3 }])
      expect(result.f[1].data).toEqual([{ v: 7 }, { v: 6 }, { v: 5 }, { v: 4 }])
      expect(result.f[2].data).toEqual([{ v: 3 }, { v: 2 }, { v: 6 }, { v: 7 }])
      expect(result.f[3].data).toEqual([{ v: 4 }, { v: 0 }, { v: 3 }, { v: 7 }])
    })
  })

  describe('Cube with negative reference numbers', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v 0.000000 2.000000 2.000000
        v 0.000000 0.000000 2.000000
        v 2.000000 0.000000 2.000000
        v 2.000000 2.000000 2.000000
        f -4 -3 -2 -1

        v 2.000000 2.000000 0.000000
        v 2.000000 0.000000 0.000000
        v 0.000000 0.000000 0.000000
        v 0.000000 2.000000 0.000000
        f -4 -3 -2 -1

        v 2.000000 2.000000 2.000000
        v 2.000000 0.000000 2.000000
        v 2.000000 0.000000 0.000000
        v 2.000000 2.000000 0.000000
        f -4 -3 -2 -1

        v 0.000000 2.000000 0.000000
        v 0.000000 2.000000 2.000000
        v 2.000000 2.000000 2.000000
        v 2.000000 2.000000 0.000000
        f -4 -3 -2 -1

        v 0.000000 2.000000 0.000000
        v 0.000000 0.000000 0.000000
        v 0.000000 0.000000 2.000000
        v 0.000000 2.000000 2.000000
        f -4 -3 -2 -1

        v 0.000000 0.000000 2.000000
        v 0.000000 0.000000 0.000000
        v 2.000000 0.000000 0.000000
        v 2.000000 0.000000 2.000000
        f -4 -3 -2 -1
      `)

      expect(result.v.length).toBe(24)

      expect(result.f.length).toBe(6)
      expect(result.f[0].data).toEqual([{ v: 0 }, { v: 1 }, { v: 2 }, { v: 3 }])
      expect(result.f[1].data).toEqual([{ v: 4 }, { v: 5 }, { v: 6 }, { v: 7 }])
      expect(result.f[2].data).toEqual([{ v: 8 }, { v: 9 }, { v: 10 }, { v: 11 }])
      expect(result.f[3].data).toEqual([{ v: 12 }, { v: 13 }, { v: 14 }, { v: 15 }])
      expect(result.f[4].data).toEqual([{ v: 16 }, { v: 17 }, { v: 18 }, { v: 19 }])
      expect(result.f[5].data).toEqual([{ v: 20 }, { v: 21 }, { v: 22 }, { v: 23 }])
    })
  })

  describe('Taylor curve', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v       3.000    1.000   -2.500
        v       2.300  -10.100    0.500
        v       7.980    5.400   -7.000
        v       8.300   -4.700   18.100
        v       6.340    2.030    0.080
        cstype taylor
        deg 4
        curv 0.500 1.600 1 2 3 4 5
        parm u 0.000 2.000
        end
      `)

      expect(result.v.length).toBe(5)
      expect(result.curv.length).toBe(1)
      expect(result.curv[0]).toEqual({
        type: 'curv',
        u0: 0.5,
        u1: 1.6,
        data: [{ v: 0 }, { v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }],
        attr: {
          cstype: 'taylor',
          rat: false,
          degU: 4,
          degV: undefined,
        },
        body: [
          { type: 'parm u', data: [0, 2] },
        ],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
      })
    })
  })

  describe('Bezier curve', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v -2.300000 1.950000 0.000000
        v -2.200000 0.790000 0.000000
        v -2.340000 -1.510000 0.000000
        v -1.530000 -1.490000 0.000000
        v -0.720000 -1.470000 0.000000
        v -0.780000 0.230000 0.000000
        v 0.070000 0.250000 0.000000
        v 0.920000 0.270000 0.000000
        v 0.800000 -1.610000 0.000000
        v 1.620000 -1.590000 0.000000
        v 2.440000 -1.570000 0.000000
        v 2.690000 0.670000 0.000000
        v 2.900000 1.980000 0.000000
        # 13 vertices

        cstype bezier
        ctech cparm 1.000000
        deg 3
        curv 0.000000 4.000000 1 2 3 4 5 6 7 8 9 10 \
        11 12 13
        parm u 0.000000 1.000000 2.000000 3.000000  \
        4.000000
        end
      `)

      expect(result.v.length).toBe(13)
      expect(result.curv.length).toBe(1)
      expect(result.curv[0]).toEqual({
        type: 'curv',
        u0: 0,
        u1: 4,
        data: [
          { v: 0 },
          { v: 1 },
          { v: 2 },
          { v: 3 },
          { v: 4 },
          { v: 5 },
          { v: 6 },
          { v: 7 },
          { v: 8 },
          { v: 9 },
          { v: 10 },
          { v: 11 },
          { v: 12 },
        ],
        attr: {
          cstype: 'bezier',
          rat: false,
          degU: 3,
          degV: undefined,
        },
        body: [
          { type: 'parm u', data: [0, 1, 2, 3, 4] },
        ],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {
          ctech: 'cparm 1.000000',
        },
      })
    })
  })

  describe('B-spline surface', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        g bspatch
        v -5.000000 -5.000000 -7.808327
        v -5.000000 -1.666667 -7.808327
        v -5.000000 1.666667 -7.808327
        v -5.000000 5.000000 -7.808327
        v -1.666667 -5.000000 -7.808327
        v -1.666667 -1.666667 11.977780
        v -1.666667 1.666667 11.977780
        v -1.666667 5.000000 -7.808327
        v 1.666667 -5.000000 -7.808327
        v 1.666667 -1.666667 11.977780
        v 1.666667 1.666667 11.977780
        v 1.666667 5.000000 -7.808327
        v 5.000000 -5.000000 -7.808327
        v 5.000000 -1.666667 -7.808327
        v 5.000000 1.666667 -7.808327
        v 5.000000 5.000000 -7.808327
        # 16 vertices

        cstype bspline
        stech curv 0.5 10.000000
        deg 3 3
        surf 0.000000 1.000000 0.000000 1.000000 13 14 \
        15 16 9 10 11 12 5 6 7 8 1 2 3 4
        parm u -3.000000 -2.000000 -1.000000 0.000000  \
        1.000000 2.000000 3.000000 4.000000
        parm v -3.000000 -2.000000 -1.000000 0.000000  \
        1.000000 2.000000 3.000000 4.000000
        end
        # 1 element
      `)

      expect(result.v.length).toBe(16)
      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: 0,
        s1: 1,
        t0: 0,
        t1: 1,
        data: [
          { v: 12 },
          { v: 13 },
          { v: 14 },
          { v: 15 },
          { v: 8 },
          { v: 9 },
          { v: 10 },
          { v: 11 },
          { v: 4 },
          { v: 5 },
          { v: 6 },
          { v: 7 },
          { v: 0 },
          { v: 1 },
          { v: 2 },
          { v: 3 },
        ],
        attr: {
          cstype: 'bspline',
          rat: false,
          degU: 3,
          degV: 3,
        },
        body: [
          { type: 'parm u', data: [-3, -2, -1, 0, 1, 2, 3, 4] },
          { type: 'parm v', data: [-3, -2, -1, 0, 1, 2, 3, 4] },
        ],
        group: {
          g: ['bspatch'], s: 0, mg: [0, 0], o: '',
        },
        state: {
          stech: 'curv 0.5 10.000000',
        },
      })
    })
  })

  describe('Cardinal surface surface', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v -5.000000 -5.000000 0.000000
        v -5.000000 -1.666667 0.000000
        v -5.000000 1.666667 0.000000
        v -5.000000 5.000000 0.000000
        v -1.666667 -5.000000 0.000000
        v -1.666667 -1.666667 0.000000
        v -1.666667 1.666667 0.000000
        v -1.666667 5.000000 0.000000
        v 1.666667 -5.000000 0.000000
        v 1.666667 -1.666667 0.000000
        v 1.666667 1.666667 0.000000
        v 1.666667 5.000000 0.000000
        v 5.000000 -5.000000 0.000000
        v 5.000000 -1.666667 0.000000
        v 5.000000 1.666667 0.000000
        v 5.000000 5.000000 0.000000
        # 16 vertices

        cstype cardinal
        stech cparma 1.000000 1.000000
        deg 3 3
        surf 0.000000 1.000000 0.000000 1.000000 13 14 \
        15 16 9 10 11 12 5 6 7 8 1 2 3 4
        parm u 0.000000 1.000000
        parm v 0.000000 1.000000
        end
        # 1 element
      `)

      expect(result.v.length).toBe(16)
      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: 0,
        s1: 1,
        t0: 0,
        t1: 1,
        data: [
          { v: 12 },
          { v: 13 },
          { v: 14 },
          { v: 15 },
          { v: 8 },
          { v: 9 },
          { v: 10 },
          { v: 11 },
          { v: 4 },
          { v: 5 },
          { v: 6 },
          { v: 7 },
          { v: 0 },
          { v: 1 },
          { v: 2 },
          { v: 3 },
        ],
        attr: {
          cstype: 'cardinal',
          rat: false,
          degU: 3,
          degV: 3,
        },
        body: [
          { type: 'parm u', data: [0, 1] },
          { type: 'parm v', data: [0, 1] },
        ],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {
          stech: 'cparma 1.000000 1.000000',
        },
      })
    })
  })

  describe('Rational B-spline surface', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v -1.3 -1.0  0.0
        v  0.1 -1.0  0.4  7.6
        v  1.4 -1.0  0.0  2.3
        v -1.4  0.0  0.2
        v  0.1  0.0  0.9  0.5
        v  1.3  0.0  0.4  1.5
        v -1.4  1.0  0.0  2.3
        v  0.1  1.0  0.3  6.1
        v  1.1  1.0  0.0  3.3
        vt 0.0  0.0
        vt 0.5  0.0
        vt 1.0  0.0
        vt 0.0  0.5
        vt 0.5  0.5
        vt 1.0  0.5
        vt 0.0  1.0
        vt 0.5  1.0
        vt 1.0  1.0
        cstype rat bspline
        deg 2 2
        surf 0.0 1.0 0.0 1.0 1/1 2/2 3/3 4/4 5/5 6/6 \
        7/7 8/8 9/9
        parm u 0.0 0.0 0.0 1.0 1.0 1.0
        parm v 0.0 0.0 0.0 1.0 1.0 1.0
        end
      `)

      expect(result.v.length).toBe(9)
      expect(result.vt.length).toBe(9)
      expect(result.vn).not.toBeDefined(0)
      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: 0,
        s1: 1,
        t0: 0,
        t1: 1,
        data: [
          { v: 0, vt: 0 },
          { v: 1, vt: 1 },
          { v: 2, vt: 2 },
          { v: 3, vt: 3 },
          { v: 4, vt: 4 },
          { v: 5, vt: 5 },
          { v: 6, vt: 6 },
          { v: 7, vt: 7 },
          { v: 8, vt: 8 },
        ],
        attr: {
          cstype: 'bspline',
          rat: true,
          degU: 2,
          degV: 2,
        },
        body: [
          { type: 'parm u', data: [0, 0, 0, 1, 1, 1] },
          { type: 'parm v', data: [0, 0, 0, 1, 1, 1] },
        ],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
      })
    })
  })

  describe('Trimmed NURB surface', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        # trimming curve
        vp -0.675  1.850  3.000
        vp  0.915  1.930
        vp  2.485  0.470  2.000
        vp  2.485 -1.030
        vp  1.605 -1.890 10.700
        vp -0.745 -0.654  0.500
        cstype rat bezier
        deg 3
        curv2 -6 -5 -4 -3 -2 -1 -6
        parm u 0.00 1.00 2.00
        end
        # surface
        v -1.350 -1.030 0.000
        v  0.130 -1.030 0.432 7.600
        v  1.480 -1.030 0.000 2.300
        v -1.460  0.060 0.201
        v  0.120  0.060 0.915 0.500
        v  1.380  0.060 0.454 1.500
        v -1.480  1.030 0.000 2.300
        v  0.120  1.030 0.394 6.100
        v  1.170  1.030 0.000 3.300
        cstype rat bspline
        deg 2 2
        surf -1.0 2.5 -2.0 2.0 -9 -8 -7 -6 -5 -4 -3 -2 -1
        parm u -1.00 -1.00 -1.00 2.50 2.50 2.50
        parm v -2.00 -2.00 -2.00 -2.00 -2.00 -2.00
        trim 0.0 2.0 1
        end
      `)

      expect(result.vp.length).toBe(6)
      expect(result.v.length).toBe(9)

      expect(result.curv2.length).toBe(1)
      expect(result.curv2[0]).toEqual({
        type: 'curv2',
        attr: {
          cstype: 'bezier',
          rat: true,
          degU: 3,
          degV: undefined,
        },
        group: {
          g: ['default'],
          s: 0,
          mg: [0, 0],
          o: '',
        },
        data: [{ vp: 0 }, { vp: 1 } ,{ vp: 2 }, { vp: 3 }, { vp: 4 }, { vp: 5 }, { vp: 0 }],
        state: {},
        body: [
          { type: 'parm u', data: [0, 1, 2] },
        ],
      })
      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: -1,
        s1: 2.5,
        t0: -2,
        t1: 2,
        data: [
          { v: 0 },
          { v: 1 },
          { v: 2 },
          { v: 3 },
          { v: 4 },
          { v: 5 },
          { v: 6 },
          { v: 7 },
          { v: 8 },
        ],
        attr: {
          cstype: 'bspline',
          rat: true,
          degU: 2,
          degV: 2,
        },
        body: [
          { type: 'parm u', data: [-1.00, -1.00, -1.00, 2.50, 2.50, 2.50] },
          { type: 'parm v', data: [-2.00, -2.00, -2.00, -2.00, -2.00, -2.00] },
          { type: 'trim', data: [{ u0: 0, u1: 2, curv2d: 0 }],
        }],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
      })
    })
  })

  describe('Two trimming regions with a hole', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        # outer loop of first region
        deg 1
        cstype bezier
        vp 0.100 0.100
        vp 0.900 0.100
        vp 0.900 0.900
        vp 0.100 0.900
        curv2 1 2 3 4 1
        parm u 0.00 1.00 2.00 3.00 4.00
        end
        # hole in first region
        vp 0.300 0.300
        vp 0.700 0.300
        vp 0.700 0.700
        vp 0.300 0.700
        curv2 5 6 7 8 5
        parm u 0.00 1.00 2.00 3.00 4.00
        end
        # outer loop of second region
        vp 1.100 1.100
        vp 1.900 1.100
        vp 1.900 1.900
        vp 1.100 1.900
        curv2 9 10 11 12 9
        parm u 0.00 1.00 2.00 3.00 4.00
        end
        # hole in second region
        vp 1.300 1.300
        vp 1.700 1.300
        vp 1.700 1.700
        vp 1.300 1.700
        curv2 13 14 15 16 13
        parm u 0.00 1.00 2.00 3.00 4.00
        end
        # surface
        v 0.000 0.000 0.000
        v 1.000 0.000 0.000
        v 0.000 1.000 0.000
        v 1.000 1.000 0.000
        deg 1 1
        cstype bezier
        surf 0.0 2.0 0.0 2.0 1 2 3 4
        parm u 0.00 2.00
        parm v 0.00 2.00
        trim 0.0 4.0 1
        hole 0.0 4.0 2
        trim 0.0 4.0 3
        hole 0.0 4.0 4
        end
      `)

      expect(result.vp.length).toBe(16)
      expect(result.v.length).toBe(4)

      expect(result.curv2.length).toBe(4)
      expect(result.curv2[0]).toEqual({
        type: 'curv2',
        data: [{ vp: 0 }, { vp: 1 }, { vp: 2 }, { vp: 3 }, { vp: 0 }],
        attr: {
          cstype: 'bezier',
          rat: false,
          degU: 1,
          degV: undefined,
        },
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
        body: [
          { type: 'parm u', data: [0, 1, 2, 3, 4] },
        ],
      })

      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: 0,
        s1: 2,
        t0: 0,
        t1: 2,
        data: [
          { v: 0 },
          { v: 1 },
          { v: 2 },
          { v: 3 },
        ],
        attr: {
          cstype: 'bezier',
          rat: false,
          degU: 1,
          degV: 1,
        },
        body: [
          { type: 'parm u', data: [0, 2] },
          { type: 'parm v', data: [0, 2] },
          { type: 'trim', data: [{ u0: 0, u1: 4, curv2d: 0 }] },
          { type: 'hole', data: [{ u0: 0, u1: 4, curv2d: 1 }] },
          { type: 'trim', data: [{ u0: 0, u1: 4, curv2d: 2 }] },
          { type: 'hole', data: [{ u0: 0, u1: 4, curv2d: 3 }] }],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
      })
    })
  })

  describe('Trimming with a special curve', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        # trimming curve
        vp -0.675  1.850  3.000
        vp  0.915  1.930
        vp  2.485  0.470  2.000
        vp  2.485 -1.030
        vp  1.605 -1.890 10.700
        vp -0.745 -0.654  0.500
        cstype rat bezier
        deg 3
        curv2 -6 -5 -4 -3 -2 -1 -6
        parm u 0.00 1.00 2.00
        end
        # special curve
        vp -0.185  0.322
        vp  0.214  0.818
        vp  1.652  0.207
        vp  1.652 -0.455
        curv2 -4 -3 -2 -1
        parm u 2.00 10.00
        end
        # surface
        v -1.350 -1.030 0.000
        v  0.130 -1.030 0.432 7.600
        v  1.480 -1.030 0.000 2.300
        v -1.460  0.060 0.201
        v  0.120  0.060 0.915 0.500
        v  1.380  0.060 0.454 1.500
        v -1.480  1.030 0.000 2.300
        v  0.120  1.030 0.394 6.100
        v  1.170  1.030 0.000 3.300
        cstype rat bspline
        deg 2 2
        surf -1.0 2.5 -2.0 2.0 -9 -8 -7 -6 -5 -4 -3 -2 -1
        parm u -1.00 -1.00 -1.00 2.50 2.50 2.50
        parm v -2.00 -2.00 -2.00 2.00 2.00 2.00
        trim 0.0 2.0 1
        scrv 4.2 9.7 2
        end
      `)

      expect(result.vp.length).toBe(10)
      expect(result.v.length).toBe(9)

      expect(result.curv2.length).toBe(2)
      expect(result.curv2[1]).toEqual({
        type: 'curv2',
        attr: {
          cstype: 'bezier',
          rat: true,
          degU: 3,
          degV: undefined,
        },
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        data: [{ vp: 6 }, { vp: 7 }, { vp: 8 }, { vp: 9 }],
        state: {},
        body: [
          { type: 'parm u', data: [2, 10] },
        ],
      })

      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: -1,
        s1: 2.5,
        t0: -2,
        t1: 2,
        data: [
          { v: 0 },
          { v: 1 },
          { v: 2 },
          { v: 3 },
          { v: 4 },
          { v: 5 },
          { v: 6 },
          { v: 7 },
          { v: 8 },
        ],
        attr: {
          cstype: 'bspline',
          rat: true,
          degU: 2,
          degV: 2,
        },
        body: [
          { type: 'parm u', data: [-1, -1, -1, 2.5, 2.5, 2.5] },
          { type: 'parm v', data: [-2, -2, -2, 2, 2, 2] },
          { type: 'trim', data: [{ u0: 0, u1: 2, curv2d: 0 }] },
          { type: 'scrv', data: [{ u0: 4.2, u1: 9.7, curv2d: 1 }] },
        ],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
      })
    })
  })

  describe('Trimming with special points', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        # special point and space curve data
        vp 0.500
        vp 0.700
        vp 1.100
        vp 0.200 0.950
        v  0.300 1.500 0.100
        v  0.000  0.000  0.000
        v  1.000  1.000  0.000
        v  2.000  1.000  0.000
        v  3.000  0.000  0.000
        cstype bezier
        deg 3
        curv 0.2 0.9 -4 -3 -2 -1
        sp 1
        parm u 0.00 1.00
        end
        # trimming curve
        vp -0.675  1.850  3.000
        vp  0.915  1.930
        vp  2.485  0.470  2.000
        vp  2.485 -1.030
        vp  1.605 -1.890 10.700
        vp -0.745 -0.654  0.500
        cstype rat bezier
        curv2 -6 -5 -4 -3 -2 -1 -6
        parm u 0.00 1.00 2.00
        sp 2 3
        end
        # surface
        v -1.350 -1.030 0.000
        v  0.130 -1.030 0.432 7.600
        v  1.480 -1.030 0.000 2.300
        v -1.460  0.060 0.201
        v  0.120  0.060 0.915 0.500
        v  1.380  0.060 0.454 1.500
        v -1.480  1.030 0.000 2.300
        v  0.120  1.030 0.394 6.100
        v  1.170  1.030 0.000 3.300
        cstype rat bspline
        deg 2 2
        surf -1.0 2.5 -2.0 2.0 -9 -8 -7 -6 -5 -4 -3 -2 -1
        parm u -1.00 -1.00 -1.00 2.50 2.50 2.50
        parm v -2.00 -2.00 -2.00 2.00 2.00 2.00
        trim 0.0 2.0 1
        sp 4
        end
      `)

      expect(result.vp.length).toBe(10)
      expect(result.v.length).toBe(14)

      expect(result.curv.length).toBe(1)
      expect(result.curv2.length).toBe(1)
      expect(result.surf.length).toBe(1)
      expect(result.surf[0]).toEqual({
        type: 'surf',
        s0: -1,
        s1: 2.5,
        t0: -2,
        t1: 2,
        data: [
          { v: 5 },
          { v: 6 },
          { v: 7 },
          { v: 8 },
          { v: 9 },
          { v: 10 },
          { v: 11 },
          { v: 12 },
          { v: 13 },
        ],
        attr: {
          cstype: 'bspline',
          rat: true,
          degU: 2,
          degV: 2,
        },
        body: [
          { type: 'parm u', data: [-1, -1, -1, 2.5, 2.5, 2.5] },
          { type: 'parm v', data: [-2, -2, -2, 2, 2, 2] },
          { type: 'trim', data: [{ u0: 0, u1: 2, curv2d: 0 }] },
          { type: 'sp', data: [4] },
        ],
        group: {
          g: ['default'], s: 0, mg: [0, 0], o: '',
        },
        state: {},
      })
    })
  })

  describe('Two adjoining squares with vertex normals', () => {
    it('parses', () => {
      const result = OBJ.parse(`
        v 0.000000 2.000000 0.000000
        v 0.000000 0.000000 0.000000
        v 2.000000 0.000000 0.000000
        v 2.000000 2.000000 0.000000
        v 4.000000 0.000000 -1.255298
        v 4.000000 2.000000 -1.255298
        vn 0.000000 0.000000 1.000000
        vn 0.000000 0.000000 1.000000
        vn 0.276597 0.000000 0.960986
        vn 0.276597 0.000000 0.960986
        vn 0.531611 0.000000 0.846988
        vn 0.531611 0.000000 0.846988
        # 6 vertices

        # 6 normals

        g all
        s 1
        f 1//1 2//2 3//3 4//4
        f 4//4 3//3 5//5 6//6
        # 2 elements
      `)

      expect(result.v.length).toBe(6)
      expect(result.vn.length).toBe(6)
      expect(result.f.length).toBe(2)
      expect(result.f[0]).toEqual({
        type: 'f',
        state: {},
        group: {
          g: ['all'],
          s: 1,
          mg: [0, 0],
          o: '',
        },
        data: [
          { v: 0, vn: 0 },
          { v: 1, vn: 1 },
          { v: 2, vn: 2 },
          { v: 3, vn: 3 },
        ],
      })
      expect(result.f[1]).toEqual({
        type: 'f',
        state: {},
        group: {
          g: ['all'], s: 1, mg: [0, 0], o: '',
        },
        data: [
          { v: 3, vn: 3 },
          { v: 2, vn: 2 },
          { v: 4, vn: 4 },
          { v: 5, vn: 5 },
        ],
      })
    })
  })
})
