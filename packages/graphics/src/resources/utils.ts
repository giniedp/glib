import { ArrayType, DataTypeOption } from '../enums'

export function toArrayBufferView(
  data: number[] | ArrayBuffer | ArrayBufferView,
  type: DataTypeOption,
): ArrayBufferView {
  if (ArrayBuffer.isView(data)) {
    return data
  } else if (data instanceof ArrayBuffer || Array.isArray(data)) {
    return new ArrayType[type](data)
  } else {
    throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
  }
}
