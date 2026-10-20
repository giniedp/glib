import {
  AudioAssetType,
  AudioListenerComponent,
  AudioSourceComponent,
  AudioSystem,
  CameraComponent,
  EcsGame,
  SpriteComponent,
  TransformComponent,
} from '@gglib/components'
import { GameEntity } from '@gglib/ecs'
import { PlatformId } from '@gglib/graphics'
import { vec3 } from '@gglib/math'
import { mount } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })

  const panel = mount(tools, (ui) => {
    const source = game.source
    ui.group('Audio', (ui) => {
      ui.scalar(game, 'masterVolume', { label: 'Master volume', range: true, min: 0, max: 1, step: 0.01 })
    })
    ui.group('Source', (ui) => {
      ui.scalar(source, 'volume', { range: true, min: 0, max: 2, step: 0.01 })
      ui.scalar(source, 'playbackRate', { range: true, min: 0.25, max: 2, step: 0.01 })
      ui.scalar(source, 'refDistance', { range: true, min: 0.1, max: 10, step: 0.1 })
      ui.scalar(source, 'rolloffFactor', { range: true, min: 0, max: 5, step: 0.01 })
      ui.bool(source, 'spatial')
      ui.bool(source, 'loop')
      ui.bool(game, 'ping', { label: 'Ping' })
      ui.scalar(game, 'interval', { label: 'Ping interval', range: true, min: 0.1, max: 2, step: 0.05 })
      ui.button('Play', { onClick: () => game.playSound() })
      ui.button('Stop', { onClick: () => game.stopSound() })
    })
    ui.group('Orbit', (ui) => {
      ui.scalar(game, 'radius', { range: true, min: 0, max: 14, step: 0.1 })
      ui.scalar(game, 'speed', { range: true, min: -3, max: 3, step: 0.01 })
    })
  })

  game.run()
  return () => {
    game.destroy()
    panel.dispose()
  }
}

class Game extends EcsGame {
  public source = new AudioSourceComponent({ refDistance: 2, rolloffFactor: 1 })
  public masterVolume = 0.5
  public ping = true
  public interval = 0.6
  public radius = 8
  public speed = 1

  private clips: AudioBuffer[] = []
  private emitter!: GameEntity
  private angle = 0
  private nextPing = 0

  protected override onCreate(): void {
    // the audio system is opt-in
    this.world.addSystem(new AudioSystem())
  }

  public override onInitialize(): void {
    this.createCamera()
    // the listener sits in the center, facing into the screen
    this.createEntity({
      name: 'listener',
      parent: this.scene.entity,
      transform: new TransformComponent(),
      components: [new AudioListenerComponent(), new SpriteComponent({ width: 1.5, height: 1.5 }).setColor(0.3, 0.6, 1)],
    })
    this.emitter = this.createEntity({
      name: 'emitter',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(this.radius, 0, 0) }),
      components: [this.source, new SpriteComponent({ width: 1, height: 1 }).setColor(1, 0.6, 0.2)],
    })
  }

  protected override async onLoadContent(): Promise<void> {
    // decoded with the audio context of the system
    this.clips = await Promise.all(
      [0, 1, 2, 3, 4].map((i) => this.content.load(AudioAssetType, `/audio/impact/impactGlass_medium_00${i}.ogg`)),
    )
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, 0, 10) }),
      components: [new CameraComponent({ type: 'orthographic', orthographicScale: 32, near: 0.1, far: 100 })],
    })
    this.scene.setCamera(0, entity.component(CameraComponent))
  }

  override onUpdate(time: number, dt: number): void {
    this.scene.getCamera<CameraComponent>(0).aspect = this.device.output.aspectRatio
    this.world.getSystem(AudioSystem).audio.volume = this.masterVolume

    this.angle += this.speed * dt
    const transform = this.emitter.getTransform<TransformComponent>()!
    transform.setPosition(Math.cos(this.angle) * this.radius, Math.sin(this.angle) * this.radius, 0)

    if (this.ping && this.clips.length && time >= this.nextPing) {
      this.nextPing = time + this.interval
      this.playRandomClip()
    }
  }

  public playSound() {
    this.playRandomClip()
  }

  public stopSound() {
    this.ping = false
    this.source.stop()
  }

  private playRandomClip() {
    if (this.clips.length) {
      this.source.setClip(this.clips[Math.floor(Math.random() * this.clips.length)]).play()
    }
  }
}
