import { maxSatisfying, satisfies } from 'semver'

export function checkVersion(version = '0.0.0', versions: string[]): [boolean, string | null] {
  let v = version
  if (v === 'latest')
    v = '*'
  const prefix = v.charCodeAt(0)
  if (prefix > 47 && prefix < 58)
    v = `^${v}`
  const max = versions[0]
  return [satisfies(max, v), maxSatisfying(versions, version)]
}
