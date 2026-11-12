import { Renderer } from '@gglib/render'
import { Graph, Group, SelectWidget, Tabs, type GraphRow } from 'tweak-ui'
import { DebugShapeSystem } from '../../../game/debug/DebugShapeSystem'
import { SkyLightSystem } from '../../../game/level/SkyLightSystem'
import { LightSystem } from '../../../game/light/LightSystem'
import { ProbeCubeLoader } from '../../../content/ProbeCubeLoader'
import { EnvProbeDebugSystem } from '../../../game/probes/EnvProbeDebugSystem'
import { EnvProbeSystem } from '../../../game/probes/EnvProbeSystem'
import { DebugOptions } from '../../../material'
import type { NwViewer } from '../../../viewer'
import { usePanel } from '../panel'
import { ResourcesStats } from './resourcesStats'
import { CameraComponentProps } from '../registry/uiCameraComponent'
import { DebugShapeSystemProps } from '../registry/uiDebugShapeSystem'
import { EnvProbeSystemProps } from '../registry/uiEnvProbeSystem'
import { LightSystemProps } from '../registry/uiLightSystem'
import { RenderPipelineProps } from '../registry/uiRenderPipeline'
import { TimeOfDayProps } from '../registry/uiTimeOfDay'

/**
 * Stats graphs (tabs), camera, debug, time of day, lights and render pipeline
 */
export function StatsPanel(props: { viewer: NwViewer }) {
  const viewer = props.viewer
  const panel = usePanel()
  return (
    <>
      <Tabs
        tabs={graphTabs(viewer).map((tab) => ({
          title: tab.title,
          content: () => <Graph collapsed rows={tab.rows} />,
        }))}
      />
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
      <Group title="Resources" collapsible defaultCollapsed>
        <ResourcesStats viewer={viewer} />
      </Group>
      <Group title="Lights">
        <LightSystemProps data={viewer.world.getSystem(LightSystem)} />
      </Group>
      <Group title="Environment Probes" collapsible>
        <EnvProbeSystemProps
          data={viewer.world.getSystem(EnvProbeSystem)}
          cubes={viewer.world.getSystem(ProbeCubeLoader)}
          debug={viewer.world.getSystem(EnvProbeDebugSystem)}
          viewer={viewer}
        />
      </Group>
      <Group title="Render Pipeline" collapsible>
        <RenderPipelineProps data={viewer.world.getSystem(Renderer).pipeline} device={viewer.device} />
      </Group>
    </>
  )
}

/**
 * A graph row with a smoothed curve
 */
function curve(name: string, max: number, sample: () => number): GraphRow {
  return { name, min: 0, max, smoothing: 0.9, sample }
}

/**
 * A text only row (no curve) for integer counters
 */
function counter(name: string, sample: () => number): GraphRow {
  return { name, min: 0, max: 1, sample, noGraph: true, fractionDigits: 0 }
}

/**
 * Stats graph rows, grouped into tabs so each graph stays readable
 */
function graphTabs(viewer: NwViewer): Array<{ title: string; rows: GraphRow[] }> {
  const mb = (bytes: number) => bytes / 1024 / 1024
  return [
    {
      title: 'Frame',
      rows: [
        curve('Frame Time', 100, () => viewer.stats.frameTime.current * 1000),
        curve('FPS', 240, () => viewer.stats.fps.current),
        curve('Update (ms)', 50, () => viewer.world.stats.update.current),
        curve('Draw (ms)', 50, () => viewer.stats.draw.current),
        counter('Tasks total', () => viewer.schedulerStats?.total || 0),
        counter('Tasks in Flight', () => viewer.schedulerStats?.inFlight || 0),
      ],
    },
    {
      title: 'Render',
      rows: [
        curve('Lists collect (ms)', 20, () => viewer.renderStats?.listCollectMs ?? 0),
        curve('Lists sort (ms)', 20, () => viewer.renderStats?.listSortMs ?? 0),
        curve('Lists batch (ms)', 20, () => viewer.renderStats?.listBatchMs ?? 0),
        counter('List items', () => viewer.renderStats?.listItems ?? 0),
        counter('Draw count', () => viewer.renderStats?.drawCount || 0),
        counter('Visible count', () => viewer.sceneStats?.visible || 0),
      ],
    },
    {
      title: 'Memory',
      rows: [
        curve('Frame (MB)', 2048, () => mb(viewer.world.getSystem(Renderer).resourceSizeInBytes)),
        curve('Heap (MB)', 2048, () => mb((performance as any).memory?.usedJSHeapSize ?? 0)),
        curve('Textures', 1000, () => viewer.deviceStats?.textureCount || 0),
        curve('Texture (MB)', 2048, () => mb(viewer.deviceStats?.textureByteCount || 0)),
        curve('Shaders', 20, () => viewer.deviceStats?.shaderCount || 0),
      ],
    },
  ]
}
