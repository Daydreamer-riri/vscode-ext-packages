export interface PackageData {
  tags: Record<string, string>
  versions: string[]
  time?: Record<string, string>
  error?: Error | string
}
