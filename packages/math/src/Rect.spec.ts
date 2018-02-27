import { Rect } from './Rect'

describe('Rect', () => {
  function expectComponents(r: Rect, x: number, y: number, width: number, height: number) {
    expect(r.x).toBeCloseTo(x, 5, 'x component')
    expect(r.y).toBeCloseTo(y, 5, 'y component')
    expect(r.width).toBeCloseTo(width, 5, 'width component')
    expect(r.height).toBeCloseTo(height, 5, 'height component')
  }

  describe('#new', () => {
    it ('initializes components to 0', () => {
      expectComponents(new Rect(), 0, 0, 0, 0)
    })

    it ('initializes components', () => {
      expectComponents(new Rect(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('#left', () => {
    it ('gets x', () => {
      const r = new Rect(1, 2, 3, 4)
      expect(r.x).toBe(1)
      expect(r.left).toBe(1)
    })
    it ('sets x', () => {
      const r = new Rect(1, 2, 3, 4)
      r.left = 10
      expect(r.x).toBe(10)
      expect(r.left).toBe(10)
    })
  })

  describe('#top', () => {
    it ('gets y', () => {
      const r = new Rect(1, 2, 3, 4)
      expect(r.y).toBe(2)
      expect(r.top).toBe(2)
    })
    it ('sets y', () => {
      const r = new Rect(1, 2, 3, 4)
      r.top = 10
      expect(r.y).toBe(10)
      expect(r.top).toBe(10)
    })
  })

  describe('#right', () => {
    it ('gets x + width', () => {
      const r = new Rect(1, 2, 30, 40)
      expect(r.width).toBe(30)
      expect(r.right).toBe(31)
    })
    it ('sets width', () => {
      const r = new Rect(1, 2, 30, 40)
      r.right = 11
      expect(r.width).toBe(10)
      expect(r.right).toBe(11)
    })
  })

  describe('#bottom', () => {
    it ('gets y + height', () => {
      const r = new Rect(1, 2, 30, 40)
      expect(r.bottom).toBe(42)
      expect(r.bottom).toBe(42)
    })
    it ('sets height', () => {
      const r = new Rect(1, 2, 30, 40)
      r.bottom = 12
      expect(r.height).toBe(10)
      expect(r.bottom).toBe(12)
    })
  })

  describe('#floor', () => {
    it ('floors x component', () => {
      expect(new Rect(1.49, 0, 0, 0).floor().x).toBe(1)
      expect(new Rect(1.5, 0, 0, 0).floor().x).toBe(1)
    })
    it ('floors y component', () => {
      expect(new Rect(0, 1.49, 0, 0).floor().y).toBe(1)
      expect(new Rect(0, 1.5, 0, 0).floor().y).toBe(1)
    })
    it ('floors width component', () => {
      expect(new Rect(0, 0, 1.49, 0).floor().width).toBe(1)
      expect(new Rect(0, 0, 1.5, 0).floor().width).toBe(1)
    })
    it ('floors height component', () => {
      expect(new Rect(0, 0, 0, 1.49).floor().height).toBe(1)
      expect(new Rect(0, 0, 0, 1.5).floor().height).toBe(1)
    })
  })

  describe('#ceil', () => {
    it ('ceils x component', () => {
      expect(new Rect(1.49, 0, 0, 0).ceil().x).toBe(2)
      expect(new Rect(1.5, 0, 0, 0).ceil().x).toBe(2)
    })
    it ('ceils y component', () => {
      expect(new Rect(0, 1.49, 0, 0).ceil().y).toBe(2)
      expect(new Rect(0, 1.5, 0, 0).ceil().y).toBe(2)
    })
    it ('ceils width component', () => {
      expect(new Rect(0, 0, 1.49, 0).ceil().width).toBe(2)
      expect(new Rect(0, 0, 1.5, 0).ceil().width).toBe(2)
    })
    it ('ceils height component', () => {
      expect(new Rect(0, 0, 0, 1.49).ceil().height).toBe(2)
      expect(new Rect(0, 0, 0, 1.5).ceil().height).toBe(2)
    })
  })

  describe('#round', () => {
    it ('rounds x component', () => {
      expect(new Rect(1.49, 0, 0, 0).round().x).toBe(1)
      expect(new Rect(1.5, 0, 0, 0).round().x).toBe(2)
    })
    it ('rounds y component', () => {
      expect(new Rect(0, 1.49, 0, 0).round().y).toBe(1)
      expect(new Rect(0, 1.5, 0, 0).round().y).toBe(2)
    })
    it ('rounds width component', () => {
      expect(new Rect(0, 0, 1.49, 0).round().width).toBe(1)
      expect(new Rect(0, 0, 1.5, 0).round().width).toBe(2)
    })
    it ('rounds height component', () => {
      expect(new Rect(0, 0, 0, 1.49).round().height).toBe(1)
      expect(new Rect(0, 0, 0, 1.5).round().height).toBe(2)
    })
  })

  describe('#getTopLeft', () => {
    it ('gets point', () => {
      expect(new Rect(1, 2, 30, 40).getTopLeft().x).toBe(1)
      expect(new Rect(1, 2, 30, 40).getTopLeft().y).toBe(2)
    })
  })

  describe('#getTopRight', () => {
    it ('gets point', () => {
      expect(new Rect(1, 2, 30, 40).getTopRight().x).toBe(31)
      expect(new Rect(1, 2, 30, 40).getTopRight().y).toBe(2)
    })
  })

  describe('#getBottomLeft', () => {
    it ('gets point', () => {
      expect(new Rect(1, 2, 30, 40).getBottomLeft().x).toBe(1)
      expect(new Rect(1, 2, 30, 40).getBottomLeft().y).toBe(42)
    })
  })

  describe('#getBottomRight', () => {
    it ('gets point', () => {
      expect(new Rect(1, 2, 30, 40).getBottomRight().x).toBe(31)
      expect(new Rect(1, 2, 30, 40).getBottomRight().y).toBe(42)
    })
  })

  describe('#getCenter', () => {
    it ('gets point', () => {
      expect(new Rect(1, 2, 30, 40).getCenter().x).toBe(16)
      expect(new Rect(1, 2, 30, 40).getCenter().y).toBe(22)
    })
  })

  describe('#setCenter', () => {
    it ('gets point', () => {
      expectComponents(new Rect(1, 2, 30, 40).setCenter({ x: 20, y: 21 }), 5, 1, 30, 40)
    })
  })

  describe('#contains*', () => {
    it ('checks if coordinate is inside rect', () => {
      [
        { x: 1, y: 1 },
        { x: 2.9, y: 1 },
        { x: 1, y: 2.9 },
        { x: 2.9, y: 2.9 },
      ].forEach((it) => {
        expect(new Rect(1, 1, 2, 2).contains(it)).toBe(true, `contains x:${it.x} y:${it.y}`)
        expect(new Rect(1, 1, 2, 2).containsXY(it.x, it.y)).toBe(true, `containsXY x:${it.x} y:${it.y}`)
      });

      [
        { x: 0.9, y: 1 },
        { x: 1, y: 0.9 },
        { x: 3, y: 1 },
        { x: 2.9, y: 0.9 },
        { x: 1, y: 3 },
      ].forEach((it) => {
        expect(new Rect(1, 1, 2, 2).contains(it)).toBe(false, `contains x:${it.x} y:${it.y}`)
        expect(new Rect(1, 1, 2, 2).containsXY(it.x, it.y)).toBe(false, `containsXY x:${it.x} y:${it.y}`)
      })
    })

    it ('checks if rect is contained', () => {
      [
        new Rect(1, 1, 2, 2),
        new Rect(1, 1, 1, 1),
        new Rect(2, 2, 1, 1),
      ].forEach((it) => {
        expect(new Rect(1, 1, 2, 2).containsRect(it)).toBe(true, `contains x:${it.x} y:${it.y} width:${it.width} height:${it.height}`)
      });

      [
        new Rect(0.9, 1, 1, 1),
        new Rect(1, 0.9, 1, 1),
        new Rect(2.1, 1, 1, 1),
        new Rect(1, 2.1, 1, 1),
      ].forEach((it) => {
        expect(new Rect(1, 1, 2, 2).containsRect(it)).toBe(false, `contains x:${it.x} y:${it.y} width:${it.width} height:${it.height}`)
      })
    })
  })

  describe('#intersects', () => {
    it ('checks for rectangle intersection', () => {
      [
        new Rect(1, 1, 2, 2),
        new Rect(1, 1, 1, 1),
        new Rect(2, 2, 1, 1),
        new Rect(0.9, 1, 1, 1),
        new Rect(1, 0.9, 1, 1),
        new Rect(2.9, 1, 1, 1),
        new Rect(1, 2.9, 1, 1),
      ].forEach((it) => {
        expect(new Rect(1, 1, 2, 2).intersects(it)).toBe(true, `intersects x:${it.x} y:${it.y} width:${it.width} height:${it.height}`)
        expect(Rect.intersects(it, new Rect(1, 1, 2, 2))).toBe(true,
        `intersects x:${it.x} y:${it.y} width:${it.width} height:${it.height}`)
      });

      [
        new Rect(0, 0, 1, 1),
      ].forEach((it) => {
        expect(new Rect(1, 1, 2, 2).intersects(it)).toBe(false, `intersects x:${it.x} y:${it.y} width:${it.width} height:${it.height}`)
        expect(Rect.intersects(it, new Rect(1, 1, 2, 2))).toBe(false,
          `intersects x:${it.x} y:${it.y} width:${it.width} height:${it.height}`)
      })
    })
  })

  describe('#inflate', () => {
    it ('inflates in all directions', () => {
      expectComponents(new Rect(1, 2, 3, 4).inflate(10, 20), -9, -18, 23, 44)
    })
  })

  describe('#move*', () => {
    it ('moves by XY', () => {
      expectComponents(new Rect(1, 2, 3, 4).moveXY(5, 6), 6, 8, 3, 4)
    })

    it ('moves by Vec', () => {
      expectComponents(new Rect(1, 2, 3, 4).move({ x: 5, y: 6 }), 6, 8, 3, 4)
    })
  })

  describe('#equals', () => {
    it ('compares all components', () => {
      expect(new Rect(1, 0, 0, 0).equals(new Rect(1, 0, 0, 0))).toBe(true)
      expect(new Rect(0, 1, 0, 0).equals(new Rect(0, 1, 0, 0))).toBe(true)
      expect(new Rect(0, 0, 1, 0).equals(new Rect(0, 0, 1, 0))).toBe(true)
      expect(new Rect(0, 0, 0, 1).equals(new Rect(0, 0, 0, 1))).toBe(true)

      expect(new Rect(1, 0, 0, 0).equals(new Rect(2, 0, 0, 0))).toBe(false)
      expect(new Rect(0, 1, 0, 0).equals(new Rect(0, 2, 0, 0))).toBe(false)
      expect(new Rect(0, 0, 1, 0).equals(new Rect(0, 0, 2, 0))).toBe(false)
      expect(new Rect(0, 0, 0, 1).equals(new Rect(0, 0, 0, 2))).toBe(false)
    })
  })

  describe('#union', () => {
    it ('unites rectangles', () => {
      expectComponents(Rect.union(new Rect(1, 2, 3, 4), new Rect(1, 2, 3, 4)), 1, 2, 3, 4)
      expectComponents(Rect.union(new Rect(1, 1, 1, 1), new Rect(3, 3, 1, 1)), 1, 1, 3, 3)
      expectComponents(Rect.union(new Rect(1, 1, 1, 1), new Rect(-3, -3, 1, 1)), -3, -3, 5, 5)
    })
  })

  describe('#intersection', () => {
    it ('unites rectangles', () => {
      expectComponents(Rect.intersection(new Rect(1, 2, 3, 4), new Rect(1, 2, 3, 4)), 1, 2, 3, 4)
      expectComponents(Rect.intersection(new Rect(1, 1, 1, 1), new Rect(3, 3, 1, 1)), 0, 0, 0, 0)
      expectComponents(Rect.intersection(new Rect(1, 1, 1, 1), new Rect(-3, -3, 1, 1)), 0, 0, 0, 0)
      expectComponents(Rect.intersection(new Rect(-2, -2, 5, 5), new Rect(0, 0, 10, 10)), 0, 0, 3, 3)
      expectComponents(Rect.intersection(new Rect(-2, -2, 5, 5), new Rect(0, -3, 10, 10)), 0, -2, 3, 5)
      expectComponents(Rect.intersection(new Rect(-2, -2, 5, 5), new Rect(-3, -3, 10, 10)), -2, -2, 5, 5)
    })
  })
})
