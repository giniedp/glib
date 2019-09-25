import { Entity, Service } from '@gglib/ecs'
import { SceneryCollectable, SceneryCollector } from './Scenery'

/**
 * A component where others can register if they have something to contribute to scene rendering
 *
 * @public
 * @remarks
 * It likely for an entity to have multiple components that need to contribute to the
 * scene rendering. This component is a link between the rendering system and
 * the renderable components of an entity.
 */
@Service()
export class SceneryLinkComponent implements SceneryCollectable {
  public static ensure(e: Entity) {
    if (!e.getService(SceneryLinkComponent, null)) {
      e.addComponent(new SceneryLinkComponent())
    }
  }

  public readonly name = 'SceneryLink'

  private registry: SceneryCollectable[] = []

  /**
   * Registeres a scenery contributor
   *
   * @param collectable - the contributor
   */
  public register(collectable: SceneryCollectable) {
    const index = this.registry.indexOf(collectable)
    if (index === -1) {
      this.registry.push(collectable)
    }
  }

  /**
   * Unregisteres a scenery contributor
   *
   * @param collectable - the contributor
   */
  public unregister(collectable: SceneryCollectable) {
    const index = this.registry.indexOf(collectable)
    if (index >= 0) {
      this.registry.splice(index, 1)
    }
  }

  /**
   * Collects scenery items from all registered contributors
   *
   * @param scenery - the scenery collector
   */
  public collectScenery(scenery: SceneryCollector) {
    for (let i = 0; i < this.registry.length; i++) {
      this.registry[i].collectScenery(scenery)
    }
  }
}
