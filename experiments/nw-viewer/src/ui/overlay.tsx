import { createSignal, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { Button, Icon, Toolbar, track } from 'tweak-ui'
import type { NwViewer } from '../viewer'
import svgCamera from './icons/camera-viewfinder.svg?raw'
import svgSidebarR from './icons/sidebar-right.svg?raw'
import svgSidebar from './icons/sidebar.svg?raw'
import svgTimer from './icons/timer.svg?raw'
import svgVolume from './icons/volume-high.svg?raw'
import svgVolumeOff from './icons/volume-xmark.svg?raw'
import { PanelScope } from './panel'
import { NwSceneBrowser, ScenesButton, SettingsButton, StatsBar, StatsPanel } from './panels'
import { configValue } from './reactive'
import { uiRegistry } from './registry'

export function attachOverlay(element: HTMLElement, viewer: NwViewer) {
  const host = document.createElement('div')
  host.className = 'tweak-ui nw-overlay'
  element.appendChild(host)
  return render(() => <Overlay viewer={viewer} />, host)
}

/**
 * Freezes the game clock at its current time, or lets a paused or fixed clock run again
 */
function toggleClock(viewer: NwViewer) {
  const clock = viewer.clock
  if (clock.game.paused || clock.game.fixed != null) {
    clock.setFixed(null)
    clock.resume()
  } else {
    clock.pause()
  }
}

/**
 * The toolbar above the canvas and the sidebars: the scene browser on the left, stats and settings on the right
 */
function Overlay(props: { viewer: NwViewer }) {
  const viewer = props.viewer
  const [left, setLeft] = createSignal(false)
  const [right, setRight] = createSignal(false)
  const audioEnabled = configValue(viewer.config, 'audioEnabled')
  // scripts and ?clock= change the clock as well, so it is polled
  const clockFrozen = track(() => viewer.clock.game.paused || viewer.clock.game.fixed != null, { interval: 500 })
  const registry = uiRegistry()

  return (
    <div class="nw-overlay-layout">
      <Toolbar
        class="nw-overlay-toolbar"
        start={
          <>
            <Button square icon={<Icon svg={svgSidebar} />} active={left()} onClick={() => setLeft(!left())} />
            <Button
              square
              accent={audioEnabled()}
              title={audioEnabled() ? 'Disable audio' : 'Enable audio'}
              icon={<Icon svg={audioEnabled() ? svgVolume : svgVolumeOff} />}
              // runs in the click, so the audio context can start (autoplay policy)
              onClick={() => viewer.config.set('audioEnabled', !audioEnabled())}
            />
            <Button
              square
              accent={clockFrozen()}
              title={
                clockFrozen()
                  ? `Time is frozen at ${viewer.clock.game.total.toFixed(2)} s, click to run`
                  : 'Freeze the time (shaders, particles, fog volumes), for comparable shots'
              }
              icon={<Icon svg={svgTimer} />}
              onClick={() => toggleClock(viewer)}
            />
          </>
        }
        end={
          <>
            <StatsBar viewer={viewer} />
            <ScenesButton viewer={viewer} />
            <SettingsButton viewer={viewer} />
            <Button
              square
              title="Download screenshot (canvas resolution)"
              icon={<Icon svg={svgCamera} />}
              onClick={() => viewer.downloadScreenshot()}
            />
            <Button square icon={<Icon svg={svgSidebarR} />} active={right()} onClick={() => setRight(!right())} />
          </>
        }
      />
      <div class="nw-overlay-panes">
        <Show when={left()}>
          <aside class="nw-overlay-sidebar twk:bg-base-200">
            <PanelScope>
              <NwSceneBrowser viewer={viewer} registry={registry} />
            </PanelScope>
          </aside>
        </Show>
        <div class="nw-overlay-fluid" />
        <Show when={right()}>
          <aside class="nw-overlay-sidebar twk:bg-base-200">
            <PanelScope>
              <StatsPanel viewer={viewer} />
            </PanelScope>
          </aside>
        </Show>
      </div>
    </div>
  )
}
