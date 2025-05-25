import { beforeEach, describe, expect, it } from 'vitest'
import { PROGRAM_BASIC_TEXTURED } from '../../programs'
import { DeviceGL } from '../DeviceGL'

describe('ShaderProgramGL', () => {
  let device: DeviceGL
  beforeEach(() => {
    device = new DeviceGL({})
  })

  it('counts references for same source', () => {
    const vs = PROGRAM_BASIC_TEXTURED.vertexShader
    const fs = PROGRAM_BASIC_TEXTURED.fragmentShader

    const p1 = device.createProgram({
      vertexShader: vs,
      fragmentShader: fs,
    })
    expect(p1.referenceCount).toBe(1)
    expect(device.countProgramReferences()).toBe(1)
    expect(device.countPrograms()).toBe(1)

    const p2 = device.createProgram({
      vertexShader: vs,
      fragmentShader: fs,
    })
    expect(p2.referenceCount).toBe(2)
    expect(device.countProgramReferences()).toBe(2)
    expect(device.countPrograms()).toBe(1)

    expect(p1).toBe(p2)

    p2.dispose()
    expect(p2.referenceCount).toBe(1)

    p1.dispose()
    expect(p1.referenceCount).toBe(0)

    // counter reached 0, resource should be gone
    // new texture with same source should create new resource and counter

    const p3 = device.createProgram({
      vertexShader: vs,
      fragmentShader: fs,
    })
    expect(p3.referenceCount).toBe(1)
    expect(p3).not.toBe(p1)
  })

  it('creates unique resources when source code altered', () => {
    const vs = PROGRAM_BASIC_TEXTURED.vertexShader
    const fs = PROGRAM_BASIC_TEXTURED.fragmentShader

    const p1 = device.createProgram({
      vertexShader: vs,
      fragmentShader: fs,
    })
    expect(p1.referenceCount).toBe(1)
    expect(device.countProgramReferences()).toBe(1)
    expect(device.countPrograms()).toBe(1)

    const p2 = device.createProgram({
      vertexShader: vs,
      fragmentShader: '#define FOO\n' + fs,
    })
    expect(p2.referenceCount).toBe(1)
    expect(device.countProgramReferences()).toBe(2)
    expect(device.countPrograms()).toBe(2)

    expect(p1).not.toBe(p2)

    p1.dispose()
    expect(p1.referenceCount).toBe(0)
    expect(device.countProgramReferences()).toBe(1)
    expect(device.countPrograms()).toBe(1)

    p2.dispose()
    expect(p2.referenceCount).toBe(0)
    expect(device.countProgramReferences()).toBe(0)
    expect(device.countPrograms()).toBe(0)
  })
})
