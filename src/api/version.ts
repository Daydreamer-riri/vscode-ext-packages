import { execCmd } from '../utils/cmd'

export async function version(name: string, cwd: string) {
  const cmd = `npm view ${name} versions`
  const versions = await execCmd(cmd, cwd)
  if (!versions)
    return []
  const matchs = versions.matchAll(/'(.*?)'/g)
  return [...matchs].map(match => match[1])
}
