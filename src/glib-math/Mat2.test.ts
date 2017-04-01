describe("Glib.Mat2", () => {
  let Mat2 = Glib.Mat2
  let Vec2 = Glib.Vec2

  describe("#initAxisAngle", () => {
    it ("", () => {
      [[{ x: 1, y: 0}, Math.PI,       { x: 1, y: 1}, { x: 1, y: -1}],
       [{ x: 1, y: 0}, Math.PI * 0.5, { x: 1, y: 1}, { x: 1, y:  0}]].forEach((data) => {
        let axis = data[0]
        let angle = data[1]
        let vector = data[2]
        let expected = data[3]
        
        let mat = new Mat2().initAxisAngle(axis, angle)
        mat.transform(vector)
        expect(vector.x).toBeCloseTo(expected.x, 10)
        expect(vector.y).toBeCloseTo(expected.y, 10)
      })
    })
  })
})
