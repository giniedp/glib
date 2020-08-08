import { Model, ModelBuilder, ModelOptions } from '@gglib/graphics'
import { loader } from '@gglib/content'

import { STL } from './format'

/**
 * @public
 */
export const loadStlToModelOptions = loader({
  input: '.stl',
  output: Model.Options,
  handle: async (_, context): Promise<ModelOptions> => {
    const content = (await context.manager.downloadArrayBuffer(context.source)).content
    const data = STL.parse(content)

    const builder = ModelBuilder.begin({
      layout: 'PositionNormal',
    })

    data.solids.forEach((solid) => {
      solid.facets.forEach((f) => {

        if (builder.vertexCount > 65536 - 2) {
          builder
            .calculateTangents()
            .calculateBoundings()
            .closeMeshPart({
              name: solid.name,
              materialId: 0,
            })
        }

        builder.addIndex(builder.vertexCount + 0)
        builder.addIndex(builder.vertexCount + 1)
        builder.addIndex(builder.vertexCount + 2)
        f.vertcies.forEach((v) => {
          builder.addVertex({
            position: [v.x, v.y, v.z],
            normal: [f.normal.x, f.normal.y, f.normal.z],
          })
        })
      })

      builder
        .calculateTangents()
        .calculateBoundings()
        .closeMeshPart({
          name: solid.name,
          materialId: 0,
        })
    })

    return builder
      .calculateTangents()
      .calculateBoundings()
      .closeMesh({
        materials: [{
          technique: 'default',
          parameters: {
            DiffuseColor: [1, 1, 1],
            SpecularColor: [1, 1, 1],
            SpecularPower: 16,
          },
        }],
      })
      .endModel()
  },
})
