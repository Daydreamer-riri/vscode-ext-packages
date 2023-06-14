import type { Packument } from 'pacote'

export interface PackageData {
  tags: Record<string, string>
  versions: string[]
  time?: Record<string, string>
  raw?: Packument
  error?: Error | string
}
