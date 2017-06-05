import { IVec2, Mat2, Vec2 } from '@glib/math'

describe('Glib.Mat2', () => {

  describe('#initAxisAngle', () => {
    it ('', () => {
      [[{ x: 1, y: 0}, Math.PI,       { x: 1, y: 1}, { x: 1, y: -1}],
       [{ x: 1, y: 0}, Math.PI * 0.5, { x: 1, y: 1}, { x: 1, y:  0}]].forEach((data) => {
        let axis: IVec2 = data[0] as IVec2
        let angle: number = data[1] as number
        let vector: IVec2 = data[2] as IVec2
        let expected: IVec2 = data[3] as IVec2

        let mat = new Mat2().initAxisAngle(axis, angle)
        mat.transform(vector)
        expect(vector.x).toBeCloseTo(expected.x, 10)
        expect(vector.y).toBeCloseTo(expected.y, 10)
      })
    })
  })
})
