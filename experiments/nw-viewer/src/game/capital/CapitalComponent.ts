import { TransformComponent } from '@gglib/components'
import type { CreateEntityOptions, GameComponent, GameEntity } from '@gglib/ecs'
import { Device } from '@gglib/graphics'

export interface CapitalComponentOptions {
  //
}

export function capitalEntity(parent: GameEntity, options: CapitalComponentOptions): CreateEntityOptions {
  return {
    name: `Capital`,
    parent,
    transform: new TransformComponent({
      // world: Mat4.createTranslation(gameToRenderCoordinate(options.center, 0)),
      keepWorld: true,
    }),
    components: [new CapitalComponent(options)],
  }
}

export class CapitalComponent implements GameComponent {
  public entity: GameEntity

  public constructor(data: CapitalComponentOptions) {}

  public initialize(): void {
    const device = this.entity.service(Device)
  }

  public destroy(): void {
    //
  }
}
