import { Renderer } from '@gglib/render'
import { Graph, Group, SelectWidget, Tabs, type GraphRow } from 'tweak-ui'
import { DebugShapeSystem } from '../../game/debug/DebugShapeSystem'
import { SkyLightSystem } from '../../game/level/SkyLightSystem'
import { LightSystem } from '../../game/light/LightSystem'
import { DebugOptions } from '../../material'
import type { NwViewer } from '../../viewer'
import { usePanel } from '../panel'
import { ResourcesStats } from './resourcesStats'
import { CameraComponentProps } from '../registry/uiCameraComponent'
import { DebugShapeSystemProps } from '../registry/uiDebugShapeSystem'
import { LightSystemProps } from '../registry/uiLightSystem'
import { RenderPipelineProps } from '../registry/uiRenderPipeline'
import { TimeOfDayProps } from '../registry/uiTimeOfDay'

/**
 * Stats graph, camera, debug, time of day, lights and render pipeline
 */
export function StatsPanel(props: { viewer: NwViewer }) {
  const viewer = props.viewer
  const panel = usePanel()
  return (
    <>
      <Graph collapsed rows={graphRows(viewer)} />
      <Tabs
        tabs={[
          { title: 'Camera', content: () => <CameraComponentProps data={viewer.camera} /> },
          {
            title: 'Debug',
            content: () => (
              <>
                <SelectWidget {...panel.bind(viewer, 'debug')} label="Output" options={DebugOptions} />
                <DebugShapeSystemProps data={viewer.world.getSystem(DebugShapeSystem)} />
              </>
            ),
          },
          {
            title: 'Time of day',
            content: () => <TimeOfDayProps data={viewer.world.getSystem(SkyLightSystem).timeOfDay} />,
          },
        ]}
      />
      <Group title="Resources" collapsible>
        <ResourcesStats viewer={viewer} />
      </Group>
      <Group title="Lights">
        <LightSystemProps data={viewer.world.getSystem(LightSystem)} />
      </Group>
      <Group title="Render Pipeline" collapsible>
        <RenderPipelineProps data={viewer.world.getSystem(Renderer).pipeline} device={viewer.device} />
      </Group>
    </>
  )
}

function graphRows(viewer: NwViewer): GraphRow[] {
  const mb = (bytes: number) => bytes / 1024 / 1024
  return [
    { name: 'Frame Time', min: 0, max: 100, smoothing: 0.9, sample: () => viewer.stats.frameTime.current * 1000 },
    {
      name: 'FPS',
      min: 0,
      max: 240,
      smoothing: 0.9,
      sample: () => viewer.stats.fps.current,
    },
    { name: 'Update (ms)', min: 0, max: 50, smoothing: 0.9, sample: () => viewer.world.stats.update.current },
    { name: 'Draw (ms)', min: 0, max: 50, smoothing: 0.9, sample: () => viewer.stats.draw.current },
    { name: 'Frame (MB)', min: 0, max: 2048, sample: () => mb(viewer.world.getSystem(Renderer).resourceSizeInBytes) },
    { name: 'Heap (MB)', min: 0, max: 2048, sample: () => mb((performance as any).memory?.usedJSHeapSize ?? 0) },
    { name: 'Textures', min: 0, max: 1000, sample: () => viewer.deviceStats?.textureCount || 0 },
    { name: 'Texture (MB)', min: 0, max: 2048, sample: () => mb(viewer.deviceStats?.textureByteCount || 0) },
    { name: 'Shaders', min: 0, max: 20, sample: () => viewer.deviceStats?.shaderCount || 0 },
    { name: 'Tasks total', sample: () => viewer.schedulerStats?.total || 0, noGraph: true, fractionDigits: 0 },
    {
      name: 'Tasks in Flight',
      min: 0,
      max: 1,
      sample: () => viewer.schedulerStats?.inFlight || 0,
      noGraph: true,
      fractionDigits: 0,
    },
    {
      name: 'Visible count',
      min: 0,
      max: 1,
      sample: () => viewer.sceneStats?.visible || 0,
      noGraph: true,
      fractionDigits: 0,
    },
    {
      name: 'Draw count',
      min: 0,
      max: 1,
      sample: () => viewer.renderStats?.drawCount || 0,
      noGraph: true,
      fractionDigits: 0,
    },
  ]
}
