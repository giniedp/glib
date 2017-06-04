import { Entity } from './Entity'

export interface Component {
  node?: Entity
  name?: string
  setup?: (entity: Entity) => void
  update?: (time?: number) => void
  draw?: (time?: number) => void
  loadContent?: () => void
  service?: boolean
  enabled?: boolean
  visible?: boolean
  initialized?: boolean
}
