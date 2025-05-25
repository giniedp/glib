import { GameEntity, GameProvider } from '@gglib/ecs'
import { Vec3 } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { GameLoop } from '../systems'
import { createEntity, createGame } from './createGame'
import { TransformComponent } from './TransformComponent'

describe('@gglib/ecs/TransformComponent', () => {
  let game: GameProvider
  let eParent: GameEntity<TransformComponent>
  let eChild: GameEntity<TransformComponent>
  let parent: TransformComponent
  let child: TransformComponent

  beforeEach(() => {
    game = createGame({
      device: {},
      loop: { autostart: false },
    })
      .addSystem(new GameLoop({ autostart: false }))
      .initialize()

    eParent = createEntity({
      transform: { position: Vec3.create(0, 0, 0) },
    }).initialize(game)

    eChild = createEntity({
      parent: eParent,
      transform: { position: Vec3.create(0, 0, 0) },
    }).initialize(game)

    parent = eParent.component(TransformComponent)
    child = eChild.component(TransformComponent)
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
