describe("Glib.Mat2", () => {
  var Mat2 = Glib.Mat2
  var Vec2 = Glib.Vec2

  describe("#initAxisAngle", () => {
    it ("", () => {
      [[{ x: 1, y: 0}, Math.PI,       { x: 1, y: 1}, { x: 1, y: -1}],
       [{ x: 1, y: 0}, Math.PI * 0.5, { x: 1, y: 1}, { x: 1, y:  0}]].forEach((data) => {
        var axis = data[0]
        var angle = data[1]
        var vector = data[2]
        var expected = data[3]
        
        var mat = new Mat2().initAxisAngle(axis, angle)
        mat.transform(vector)
        expect(vector.x).toBeCloseTo(expected.x, 10)
        expect(vector.y).toBeCloseTo(expected.y, 10)
      })
    })
  })
})
