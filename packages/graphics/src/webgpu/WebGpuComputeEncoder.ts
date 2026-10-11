import type { GpuTimer } from '../GpuTimer'
import { Buffer, Program } from '../resources'
import { ComputePipelineParams } from './cache/ComputeCache'
import { WebGpuBuffer, WebGpuProgram, WebGpuShaderModule } from './resources'
import { WebGpuDevice } from './WebGpuDevice'

export class WebGpuComputeEncoder {
  public readonly device: WebGpuDevice

  private pipelineParamsChanged = true
  private pipelineParams: ComputePipelineParams = {
    shader: null,
    constants: null,
  }
  private programParams: WebGpuProgram
  private programParamsChanged = false

  private encoder: GPUCommandEncoder
  private pass: GPUComputePassEncoder
  private pipeline: GPUComputePipeline
  private passDescriptor: GPUComputePassDescriptor = {
    label: 'gglib compute',
  }

  private timer: GpuTimer = null
  private timerBegun = false

  public constructor(device: WebGpuDevice) {
    this.device = device
  }

  public setAsync(value: boolean) {
    this.pipelineParams.async = value
  }

  public setProgram(program: Program) {
    if (this.pipelineParams.shader !== program?.module) {
      const module = program?.module as WebGpuShaderModule
      this.pipelineParamsChanged = true
      this.pipelineParams.shader = module
      this.pipelineParams.constants = module?.computeConstants
    }
    if (this.programParams !== program) {
      this.programParams = program as WebGpuProgram
      this.programParamsChanged = true
    }
  }

  public dispatch(countX: number, countY?: number, countZ?: number) {
    this.getPass()?.dispatchWorkgroups(countX, countY, countZ)
  }

  public dispatchIndirect(buffer: Buffer, offset: number = 0) {
    const gpuBuffer = (buffer as WebGpuBuffer).resource
    this.getPass()?.dispatchWorkgroupsIndirect(gpuBuffer, offset)
  }

  /**
   * Starts measuring GPU time with the given timer
   *
   * @remarks
   * Acts as a barrier: the currently open pass is ended, so work encoded before is not measured.
   * The timer covers all passes begun until {@link endTimer} is called, also across {@link submit} and {@link flush}.
   * Only one timer is active per encoder, a second call replaces the active timer.
   */
  public beginTimer(timer: GpuTimer) {
    this.endPass()
    this.timer = timer
    this.timerBegun = false
  }

  /**
   * Stops measuring with the given timer, if it is the active one. Does not end the open pass.
   */
  public endTimer(timer: GpuTimer) {
    if (this.timer === timer) {
      this.timer = null
    }
  }

  /**
   * Ends the current compute pass and submits the command buffer to the GPU
   */
  public submit() {
    if (!this.encoder) {
      return
    }
    this.endPass()
    const buffer = this.encoder.finish()
    this.encoder = null
    this.device.queue.submit([buffer])
  }

  /**
   * Ends and submits the current render pass, and resets the state
   */
  public flush() {
    this.submit()
    this.reset()
  }

  public reset() {
    this.programParams = null

    this.pipelineParamsChanged = true
    this.pipelineParams.async = false
    this.pipelineParams.shader = null
    this.pipelineParams.constants = null
  }

  private getPass(): GPUComputePassEncoder | null {
    if (!this.pass) {
      const descriptor = this.passDescriptor
      if (this.timer) {
        descriptor.timestampWrites = this.device.timers.getWrites(this.timer, !this.timerBegun)
        this.timerBegun = true
      } else {
        descriptor.timestampWrites = undefined
      }
      this.pass = this.getEncoder().beginComputePass(descriptor)

      if (!this.applyPipeline(this.pass)) {
        // still loading
        return null
      }
      this.applyBindGroups()
    }
    if (this.pipelineParamsChanged) {
      if (!this.applyPipeline(this.pass)) {
        // still loading
        return null
      }
      this.applyBindGroups()
    }
    if (this.programParamsChanged) {
      this.applyBindGroups()
    }

    if (!this.pipeline) {
      // still loading
      this.pipelineParamsChanged = true
      return null
    }

    return this.pass
  }

  private applyPipeline(pass: GPUComputePassEncoder) {
    const pipeline = this.getPipeline()
    if (pipeline) {
      pass.setPipeline(pipeline)
      return true
    }
    return false
  }

  private applyBindGroups() {
    const params = this.programParams || this.pipelineParams.shader?.program
    if (!this.pass || !params) {
      return
    }
    const bindGroups = params.bindGroups
    for (let i = 0; i < bindGroups.length; i++) {
      if (bindGroups[i]) {
        // TODO: utilize bind group offsets
        this.pass.setBindGroup(i, bindGroups[i])
      }
    }
    this.programParamsChanged = false
  }

  private getEncoder() {
    this.encoder ||= this.device.gpu.createCommandEncoder({ label: 'gglib compute' })
    return this.encoder
  }

  private getPipeline() {
    if (this.pipeline && !this.pipelineParamsChanged) {
      return this.pipeline
    }
    this.pipelineParamsChanged = false
    this.pipeline = this.device.computePipelineCache.get(this.pipelineParams)
    if (!this.pipeline) {
      this.pipelineParamsChanged = true
    }
    return this.pipeline
  }

  private endPass() {
    if (!this.pass) {
      return
    }
    this.pass.end()
    this.pass = null
  }
}
