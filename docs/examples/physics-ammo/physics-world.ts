import { GameSystem } from '@gglib/ecs'
import Ammo from 'ammojs-typed'

export class PhysicsWorld extends GameSystem {
  public readonly config = new Ammo.btDefaultCollisionConfiguration()
  public readonly dispatcher = new Ammo.btCollisionDispatcher(this.config)
  public readonly pairCache = new Ammo.btDbvtBroadphase()
  public readonly solver = new Ammo.btSequentialImpulseConstraintSolver()
  public readonly world = new Ammo.btDiscreteDynamicsWorld(
    this.dispatcher,
    this.pairCache as any,
    this.solver,
    this.config,
  )

  public initialize(): void {
    //
  }

  public destroy(): void {
    Ammo.destroy(this.world)
    Ammo.destroy(this.solver)
    Ammo.destroy(this.pairCache)
    Ammo.destroy(this.dispatcher)
    Ammo.destroy(this.config)
  }

  public update(time: number, dt: number) {
    this.world.stepSimulation(dt)
  }
}
