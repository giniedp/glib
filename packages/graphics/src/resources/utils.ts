import { dataTypeToArrayType, type SurfaceFormat, surfaceFormatDataType } from '../enums'

export function toArrayBufferView(
  data: number[] | ArrayBuffer | ArrayBufferView,
  format: SurfaceFormat,
): ArrayBufferView {
  if (ArrayBuffer.isView(data)) {
    return data
  }
  if (data instanceof ArrayBuffer || Array.isArray(data)) {
    const dataType = surfaceFormatDataType(format)
    if (!dataType) {
      throw new Error(`invalid argument 'format'. must be one of [SurfaceFormat]`)
    }
    const TypedArray = dataTypeToArrayType(dataType)
    return new TypedArray(data)
  }
  throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
}
