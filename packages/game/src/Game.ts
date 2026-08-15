import { createDevice, type CreateDeviceOptions, Device } from '@gglib/graphics'
import { GameLoop } from './GameLoop'

export class Game {
  /**
   * The graphics device
   */
  public device: Device

  /**
   * The game loop system
   */
  public loop: GameLoop

  /**
   * Resolves once the game has fully booted and the loop is running
   */
  public get ready(): Promise<void> {
    return this.booted ?? Promise.reject(new Error('run() has not been called'))
  }

  private booted: Promise<void> | null = null
  private destroyed = false

  public constructor(options: CreateDeviceOptions) {
    this.device = createDevice(options)

    this.onCreate()
    this.onCreateEnd()
  }

  /**
   * Called as part of the constructor after device is created, though the device may not be ready yet
   */
  protected onCreate(): void {
    //
  }

  protected onCreateEnd() {
    this.loop ||= new GameLoop()
  }

  /**
   * Called once as part of {@link Game.run} when the GPU is ready.
   */
  protected onInitialize(): void {
    //
  }

  /**
   * Called after {@link Game.onInitialize} and awaited before the
   * game loop starts. Override to load content asynchronously.
   */
  protected onLoadContent(): Promise<void> | void {
    //
  }

  /**
   * Called when content needs to be unloaded
   */
  protected onUnloadContent(): Promise<void> | void {
    //
  }

  /**
   * Called once after initialize and load but before the first update
   */
  protected onBeginRun(): void {
    //
  }

  /**
   * Called when the game was stopped but before content unload
   */
  protected onEndRun(): void {
    //
  }

  /**
   * Called  before {@link Game.onUpdate}
   *
   * @param time time since application start in seconds
   * @param dt time since last udpate in seconds
   * @returns `false` to skip next {@link Game.onUpdate}, `true` or `void` otherwise
   */
  protected onBeginUpdate(time: number, dt: number): boolean | void {
    return true
  }

  /**
   * Called every update tick
   *
   * @param time time since application start in seconds
   * @param dt time since last udpate in seconds
   */
  protected onUpdate(time: number, dt: number): void {
    //
  }

  /**
   * Called after {@link Game.onUpdate}
   *
   * @param time time since application start in seconds
   * @param dt time since last udpate in seconds
   */
  protected onEndUpdate(time: number, dt: number): void {
    //
  }

  /**
   * Called  before {@link Game.onDraw}
   *
   * @param time time since application start in seconds
   * @param dt time since last draw in seconds
   * @returns `false` to skip next {@link Game.onUponDrawdate}, `true` or `void` otherwise
   */
  protected onBeginDraw(time: number, dt: number): boolean | void {
    return true
  }

  /**
   * Called every draw tick
   *
   * @param time time since application start in seconds
   * @param dt time since last draw in seconds
   */
  protected onDraw(time: number, dt: number): void {
    //
  }

  /**
   * Called after {@link Game.onEndDraw}
   *
   * @param time time since application start in seconds
   * @param dt time since last draw in seconds
   */
  protected onEndDraw(time: number, dt: number): void {
    //
  }

  public async run() {
    if (this.booted) {
    } else {
    }
    this.booted ||= this.boot()
    this.loop.run()
    return this.booted
  }

  /**
   * Stops the game, but does not unload the content.
   */
  public stop() {
    if (!this.loop.isRunning) {
      return
    }
    this.loop.stop()
    this.onEndRun()
  }

  /**
   * Stops the game and unloads the content
   */
  public destroy(): void {
    this.destroyed = true
    this.stop()
    this.onUnloadContent()
  }

  private async boot() {
    await this.device.ready
    if (this.destroyed) {
      return
    }

    this.onInitialize()
    await this.onLoadContent()
    if (this.destroyed) {
      return
    }

    this.onBeginRun()
    this.loop.run()
    this.loop.onUpdate.add((time) => this.handleUpdate(time.totalTime, time.deltaTime))
    this.loop.onDraw.add((time) => this.handleRender(time.totalTime, time.deltaTime))
  }

  private handleUpdate(time: number, dt: number) {
    console.assert(this.device.isReady, 'device must be ready')
    if (this.onBeginUpdate(time, dt) !== false) {
      this.onUpdate(time, dt)
      this.onEndUpdate(time, dt)
    }
  }

  private handleRender(time: number, dt: number) {
    console.assert(this.device.isReady, 'device must be ready')
    if (this.onBeginDraw(time, dt) !== false) {
      this.onDraw(time, dt)
      this.onEndDraw(time, dt)
    }
  }
}
