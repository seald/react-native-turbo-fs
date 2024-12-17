import { NativeModules } from 'react-native'

const TurboFsModule = NativeModules.TurboFs

if (TurboFsModule && typeof TurboFsModule.install === 'function') {
  TurboFsModule.install()
}

export type FuncTurboFsRead = (
  filePath: string,
  size: number,
  position: number
) => ArrayBuffer
export type FuncTurboFsAppend = (filePath: string, data: ArrayBuffer) => void

declare const turboFsRead: FuncTurboFsRead | undefined
declare const turboFsAppend: FuncTurboFsAppend | undefined

export const getNative = () => ({
  turboFsAppend,
  turboFsRead,
})

export function read(
  filePath: string,
  size: number,
  position: number
): ArrayBuffer {
  if (turboFsRead !== undefined) return turboFsRead(filePath, size, position)
  else throw new Error('turboFsRead undefined')
}

export function append(filePath: string, data: ArrayBuffer): void {
  if (turboFsAppend !== undefined) return turboFsAppend(filePath, data)
  else throw new Error('turboFsRead undefined')
}
