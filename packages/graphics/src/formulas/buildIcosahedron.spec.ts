import { Manager } from '@gglib/content'
import { buildIcosahedron, buildOctahedron, buildTetrahedron, Device, ModelBuilder } from '@gglib/graphics'

describe('@gglib/graphics/formulas', () => {
  describe('buildIcosahedron', () => {
    let device: Device
    let manager: Manager
    let builder: ModelBuilder

    beforeEach(() => {
      device = new Device()
      manager = new Manager(device)
      builder = new ModelBuilder()
    })

    it ('builds without errors', () => {
      expect(builder.vertexCount).toBe(0)
      buildIcosahedron(builder, { steps: 1 })
      expect(builder.vertexCount).not.toBe(0)

      builder.reset()
      expect(builder.vertexCount).toBe(0)
      buildOctahedron(builder, { steps: 1 })
      expect(builder.vertexCount).not.toBe(0)

      builder.reset()
      expect(builder.vertexCount).toBe(0)
      buildTetrahedron(builder, { steps: 1 })
      expect(builder.vertexCount).not.toBe(0)
    })
  })
})
