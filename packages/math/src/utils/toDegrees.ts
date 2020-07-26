const factor = 180 / Math.PI

export function toDegrees(radians: number) {
  return radians * factor
}
