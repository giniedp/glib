import { createInterval } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'

/**
 * Frame and scene stats in the toolbar, updated twice a second
 */
export function StatsBar(props: { viewer: NwViewer }) {
  const viewer = props.viewer
  const tick = createInterval(500)
  // the stats are plain engine values, re-read on each tick
  const sample = (read: () => number) => () => (tick(), read())
  return (
    <div class="nw-stats-bar">
      <Stat value={sample(() => viewer.schedulerStats?.total || 0)} unit="Tasks" title="Pending loading tasks" />
      <Stat
        value={sample(() => Math.floor(viewer.stats.fps.average))}
        width={3}
        unit="FPS"
        title="Frames per second (average)"
      />
      <Stat
        value={sample(() => viewer.stats.frameTime.average * 1000)}
        decimals={2}
        width={5}
        unit="ms"
        title="Frame time in milliseconds (average)"
      />
      <Stat
        label="update"
        value={sample(() => viewer.world.stats.update.average)}
        decimals={2}
        width={5}
        title="Update of the game world in milliseconds (average)"
      />
      <Stat
        label="draw"
        value={sample(() => viewer.stats.draw.average)}
        decimals={2}
        width={5}
        title="Draw on the CPU in milliseconds (average)"
      />
      <Stat value={sample(() => viewer.renderStats?.drawCount ?? 0)} width={4} unit="Draws" title="Draw calls per frame" />
      <Stat value={sample(() => viewer.sceneStats?.visible ?? 0)} width={4} unit="Visible" title="Visible scene objects" />
    </div>
  )
}

interface StatProps {
  value: () => number
  /**
   * Text before the value
   */
  label?: string
  /**
   * Text after the value
   */
  unit?: string
  /**
   * Fraction digits, defaults to 0
   */
  decimals?: number
  /**
   * Pads the value with zeros to this width, so the bar does not jump
   */
  width?: number
  /**
   * Tooltip: what the value is
   */
  title?: string
}

function Stat(props: StatProps) {
  const text = () => {
    const value = props.value()
    const fixed = Number.isFinite(value) ? value.toFixed(props.decimals ?? 0) : '-'
    return props.width ? fixed.padStart(props.width, '0') : fixed
  }
  return (
    <span class="nw-stat" title={props.title}>
      {props.label && <span class="nw-muted">{props.label} </span>}
      {text()}
      {props.unit && <span class="nw-muted"> {props.unit}</span>}
    </span>
  )
}
