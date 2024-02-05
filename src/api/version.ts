import fetch from 'npm-registry-fetch'
import { execCmd } from '../utils/cmd'

const NPM_REGISTRY = 'https://registry.npmjs.org/'

const mockPacoteVersion = '15.2.0'

function Header(name: string) {
  return {
    'user-agent': `pacote/${mockPacoteVersion} node/${process.version}`,
    'pacote-version': mockPacoteVersion,
    'pacote-req-type': 'packument',
    'pacote-pkg-id': `registry:${name}`,
    'accept': 'application/json',
  }
}

export async function version(name: string, cwd: string) {
  const registry = await getNpmRegistry(name, cwd)
  try {
    const data = await fetch.json(name, { registry, fullMetadata: true, headers: Header(name) }) as { versions: { [version: string]: { deprecated: string } } }
    const versions = Object.keys(data.versions || {}).filter(v => (!v.includes('-') && !data.versions[v].deprecated))
    return versions
  }
  catch {
    return null
  }
}

const registryCache = new Map<string, string>()

export async function getNpmRegistry(pkg: string, cwd: string) {
  const key = `${pkg}+++${cwd}`
  if (registryCache.has(key))
    return registryCache.get(key)!

  const cmd = 'npm config get registry'
  const scopedCmd = `npm config get ${pkg}:registry`
  const [defaultRegistry, scopedRegistry] = await Promise.all([
    execCmd(cmd, cwd).catch(() => null),
    execCmd(scopedCmd, cwd).catch(() => null),
  ])

  registryCache.set(key, scopedRegistry || defaultRegistry || NPM_REGISTRY)
  return scopedRegistry || defaultRegistry || NPM_REGISTRY
}
