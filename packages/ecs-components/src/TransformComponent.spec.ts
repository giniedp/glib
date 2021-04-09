import { Entity } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { TransformComponent } from './TransformComponent'

describe('@gglib/ecs/TransformComponent', () => {
  let eParent: Entity
  let eChild: Entity
  let parent: TransformComponent
  let child: TransformComponent

  beforeEach(() => {
    eParent = Entity.createRoot()
    eParent.install(TransformComponent)
    eParent.createChild((e) => {
      eChild = e
      eChild.install(TransformComponent)
    })
    eParent.initializeComponents(true)

    parent = eParent.get(TransformComponent)
    child = eChild.get(TransformComponent)
  })

  describe('parent', () => {
    describe('when modified', () => {
      it('does not affect child local transform', () => {
        expect(parent.position).toEqual(Vec3.createZero())
        expect(child.position).toEqual(Vec3.createZero())

        // parent.translateX(10)
        // eParent.updateComponents(16)
        // expect(parent.position).toEqual(Vec3.create(10, 0, 0))
        // expect(parent.world.getTranslation()).toEqual(Vec3.create(10, 0, 0))
        // expect(child.position).toEqual(Vec3.create(0, 0, 0))
        // expect(child.world.getTranslation()).toEqual(Vec3.create(10, 0, 0))

        // parent.rotateAxisAngleV(Vec3.Up, Math.PI / 2)
        // eParent.updateComponents(16)
        // expect(parent.position).toEqual(Vec3.create(10, 0, 0))
        // expect(parent.world.getTranslation()).toEqual(Vec3.create(10, 0, 0))
        // console.log(child.world.format(3))
        // expect(child.position).toEqual(Vec3.create(0, 0, 0))
        // expect(child.world.getTranslation()).toEqual(Vec3.create(0, 0, -10))
      })
    })
  })

})
