import { Device } from './Device'
import { DeviceGPUOptions, DeviceGPU } from './webgpu'
import { DeviceGLOptions, DeviceGL } from './webgl'

export function createDevice(options: DeviceGLOptions): DeviceGL
export function createDevice(options: DeviceGPUOptions): DeviceGPU
export function createDevice(options: DeviceGLOptions | DeviceGPUOptions): DeviceGPU
export function createDevice(options: DeviceGLOptions | DeviceGPUOptions): Device {
  if (options.context === 'gpu') {
    return new DeviceGPU(options)
  }
  return new DeviceGL(options)
}
