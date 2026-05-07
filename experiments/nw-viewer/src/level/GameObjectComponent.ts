import { BoundsComponent, ModelComponent, SpatialComponent, TransformComponent } from '@gglib/components'
import { GameEntity, type GameComponent } from '@gglib/ecs'
import { Mat4 } from '@gglib/math'
import type { EntityData } from '../api'
import { cryToGltfMat4 } from '../math'
import { ContentService } from '../services/content-service'

const DEBUG_LAYER = '' // 'dungeon_script'
const SHOW_ENCOUNTERS = ['sandworm', 'dungeon', 'raid', 'trial', 'daily', 'quest']

export class GameObjectComponent implements GameComponent {
  private modelComponent: ModelComponent
  private content: ContentService
  private data: EntityData

  public constructor(data: EntityData) {
    this.data = data
  }

  public readonly entity: GameEntity
  private isActive: boolean = false
  public initialize(): void {
    this.modelComponent = this.entity.component(ModelComponent)
    this.content = this.entity.service(ContentService)
  }

  public activate(): void {
    this.data.maxViewDistance
    this.isActive = true
    if (!this.data?.model || this.modelComponent.model) {
      return
    }
    this.content.loadModel(this.data.model, null, this.entity).then((model) => {
      this.modelComponent.model = model
    })
  }

  public deactivate(): void {
    this.isActive = false
  }

  public destroy(): void {
    //
  }
}

export function instantiateObjects(list: EntityData[], parent: GameEntity) {
  if (!list?.length) {
    return
  }

  const modelGroups: Record<string, EntityData[]> = {}
  const dubplicates: Record<string, number> = {}
  let dublicatesCount = 0
  for (const item of list) {
    if (!item.model) {
      // TODO: handle non-model items
      continue
    }
    if (DEBUG_LAYER && item.layer?.toLowerCase() !== DEBUG_LAYER) {
      continue
    }
    if (item.encounterName && !SHOW_ENCOUNTERS.includes(item.encounterName)) {
      console.debug('skip encounter', item.encounterName, item.encounter)
      continue
    }
    const key = `${item.model}#${item.material}`
    modelGroups[key] = modelGroups[key] || []
    modelGroups[key].push(item)
  }

  for (const key in modelGroups) {
    const group = modelGroups[key]
    if (group.length == 1 || !!group[0].vital) {
      for (const item of group) {
        const mKey = `${item.model}#${fromCryMatrix(item.transform)
          .elements.map((it) => it.toFixed(4))
          .join(',')}`
        if (dubplicates[mKey]) {
          dubplicates[mKey] += 1
          dublicatesCount += 1
          continue
        }
        dubplicates[mKey] = 1

        parent.world.createEntity({
          // id: item.id,
          name: item.name,
          parent: parent,
          transform: new TransformComponent({
            world: fromCryMatrix(item.transform),
            keepWorld: true,
          }),
          components: [
            new SpatialComponent(),
            new BoundsComponent(),
            new ModelComponent(),
            new GameObjectComponent(item),
          ],
        })

        // TODO: implement skinned meshes
        // const isSkinned = false // item.vital
        // if (isSkinned) {
        //   entity.addComponents(
        //     new ActionlistComponent({
        //       animationDatabase: item.vital.adbFile,
        //       defaultTags: item.vital.tags,
        //     }),
        //     new SkinnedMeshComponent({
        //       model: item.model,
        //       material: item.material,
        //       adbFile: item.vital.adbFile,
        //     }),
        //   )
        // } else {
        //   entity.addComponents(
        //     new StaticMeshComponent({
        //       model: item.model,
        //       material: item.material,
        //       // TODO: add identity matrix for first instance?
        //       instances: item.instances?.map(fromCryMatrix),
        //     }),
        //   )
        // }

        // if (item.vital) {
        //   entity.addComponent(
        //     new NameplateComponent({
        //       vital: item.vital,
        //     }),
        //   )
        // }
      }
      continue
    }

    // const lead = group[0]
    // const model = lead.model
    // const material = lead.material

    // const leadWorld = fromCryMatrix(lead.transform)
    // const leadInverse = Mat4.createFrom(leadWorld).invert()
    // const entityName = `${urlPathBasename(model)} [${group.length}]`
    // const instances: Mat4[] = []
    // const skipped: EntityData[] = []
    // const debugItems: any[] = []

    // for (const item of group) {
    //   const instanceWorld = fromCryMatrix(item.transform)
    //   const instance = Mat4.multiply(leadInverse, instanceWorld)
    //   const mKey = `${item.model}#${instanceWorld.elements.map((it) => it.toFixed(4)).join(',')}`
    //   if (dubplicates[mKey]) {
    //     dubplicates[mKey] += 1
    //     dublicatesCount += 1
    //     continue
    //   }
    //   dubplicates[mKey] = 1
    //   instances.push(instance)
    // }
    // if (skipped.length) {
    //   console.warn(entityName, 'skipped dublicates', { skipped, group })
    // }

    // parent.world.createEntity({
    //   name: entityName,
    //   parent: parent,
    //   transform: new TransformComponent({
    //     world: leadWorld,
    //     keepWorld: true,
    //     // maxDistance: Math.max(...uniq(group.map((it) => it.maxViewDistance | 0))),
    //     // userData: {
    //     //   instanceItems: group,
    //     //   debugItems,
    //     // },
    //   }),
    //   components: [
    //     // new StaticMeshComponent({
    //     //   model: model,
    //     //   material: material,
    //     //   instances: instances,
    //     // }),
    //   ],
    // })
  }

  if (dublicatesCount) {
    console.warn('Dublicates found', dublicatesCount)
  }
}

function urlPathBasename(url: string) {
  if (url.includes('?')) {
    url = url.split('?')[0]
  }
  if (url.includes('#')) {
    url = url.split('#')[0]
  }
  return url.split('/').pop()
}

function fromCryMatrix(matrix: number[]) {
  return Mat4.createFromArray(cryToGltfMat4(matrix))
}
