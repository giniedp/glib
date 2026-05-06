import { Device } from './Device'
import { WebglDevice, WebglDeviceOptions } from './webgl'
import { WebGpuDevice, WebGpuDeviceOptions } from './webgpu'

export type PlatformId = 'auto' | 'webgl2' | 'webgpu'

export interface CreateDeviceOptions {
  canvas: string | HTMLCanvasElement
  platform?: PlatformId
  autosize?: boolean
  webgl2?: Omit<WebglDeviceOptions, 'canvas' | 'autosize' | 'context'>
  webgpu?: Omit<WebGpuDeviceOptions, 'canvas' | 'autosize' | 'context'>
}

export function createDevice(options: CreateDeviceOptions): Device {
  const supportsWebGL2 = !!window.WebGL2RenderingContext
  const supportsWebGPU = !!navigator.gpu

  let platform = options.platform || 'auto'
  if (platform === 'auto') {
    platform = supportsWebGPU ? 'webgpu' : 'webgl2'
  }
  if (platform === 'webgpu') {
    if (!supportsWebGPU) {
      throw new Error('WebGPU is not supported on this platform')
    }
    return new WebGpuDevice({
      ...(options.webgpu || {}),
      canvas: options.canvas,
      autosize: options.autosize,
    })
  }
  if (platform === 'webgl2') {
    if (!supportsWebGL2) {
      throw new Error('WebGL2 is not supported on this platform')
    }
    return new WebglDevice({
      ...(options.webgl2 || {}),
      canvas: options.canvas,
      autosize: options.autosize,
    })
  }
  throw new Error(`Unsupported platform ${platform}`)
}
