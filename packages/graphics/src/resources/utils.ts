import { dataTypeToArrayType, SurfaceFormat, surfaceFormatDataType } from '../enums'

export function toArrayBufferView(
  data: number[] | ArrayBuffer | ArrayBufferView,
  format: SurfaceFormat,
): ArrayBufferView {
  if (ArrayBuffer.isView(data)) {
    return data
  } else if (data instanceof ArrayBuffer || Array.isArray(data)) {
    const ArrayType = surfaceFormatDataType(format)
    if (!ArrayType) {
      throw new Error(`invalid argument 'format'. must be one of [SurfaceFormat]`)
    }
    const TypedArray = dataTypeToArrayType(ArrayType)
    return new TypedArray(data)
  } else {
    throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
  }
}
