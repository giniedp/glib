import { Vec3 } from '@gglib/math'
import { ModelBuilder } from './ModelBuilder'

describe('Graphics.ModelBuilder', () => {

  let builder: ModelBuilder

  beforeEach(() => {
    //
  })

  // it ('merges dublicates', () => {
  //   builder = new ModelBuilder()
  //   builder.addIndex(0)
  //   builder.addIndex(1)
  //   builder.addIndex(2)
  //   builder.addIndex(1)
  //   builder.addIndex(2)
  //   builder.addIndex(3)

  //   builder.addVertex({ position: [0, 0, 0] })
  //   builder.addVertex({ position: [1, 0, 0] })
  //   builder.addVertex({ position: [0, 1, 0] })
  //   builder.addVertex({ position: [0, 0, 0] })

  //   const mesh = builder.mergeDublicates().endMeshPart()
  //   expect(mesh.indexBuffer.data).toEqual([0, 1, 2, 1, 2, 0])
  // })

  // it ('calculates normals', () => {
  //   builder = new ModelBuilder()
  //   builder.addIndex(0)
  //   builder.addIndex(2)
  //   builder.addIndex(1)
  //   builder.addIndex(0)
  //   builder.addIndex(2)
  //   builder.addIndex(3)

  //   builder.addVertex({
  //     position: [0, 0, 0],
  //   })
  //   builder.addVertex({
  //     position: [1, 0, 0],
  //   })
  //   builder.addVertex({
  //     position: [0, 1, 0],
  //   })
  //   builder.addVertex({
  //     position: [0, 0, 1],
  //   })
  //   builder.calculateNormals()
  //   const channel = builder.getChannel('normal')

  //   expect({
  //     x: channel.read(0, 0),
  //     y: channel.read(0, 1),
  //     z: channel.read(0, 2),
  //   }).toEqual(Vec3.normalize({
  //     x: 1,
  //     y: 0,
  //     z: 1,
  //   }, {} as any))

  //   expect({
  //     x: channel.read(1, 0),
  //     y: channel.read(1, 1),
  //     z: channel.read(1, 2),
  //   }).toEqual({
  //     x: 0,
  //     y: 0,
  //     z: 1,
  //   })

  //   expect({
  //     x: channel.read(2, 0),
  //     y: channel.read(2, 1),
  //     z: channel.read(2, 2),
  //   }).toEqual(Vec3.normalize({
  //     x: 1,
  //     y: 0,
  //     z: 1,
  //   }, {} as any))
  // })
})
