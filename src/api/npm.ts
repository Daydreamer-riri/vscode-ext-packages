import { window } from 'vscode'
import { ofetch } from 'ofetch'
import { execCmd } from '../utils/cmd'
import type { PackageData } from '../types'
import type Item from '../core/Item'
import { getWorkspaceFolderPath } from './config'

const cache = new Map<string, { cacheTime: number; data: PackageData }>()
const cacheTTL = 30 * 60_000 // 30min
// eslint-disable-next-line unused-imports/no-unused-vars
let cacheChanged = false

function now() {
  return +new Date()
}

function ttl(n: number) {
  return now() - n
}

const workspacePrefix = 'workspace:'

export async function getPackageData(item: Item): Promise<PackageData> {
  const name = item.key
  if (item.value.slice(0, 10) === workspacePrefix) {
    return {
      tags: {},
      versions: [item.value],
    }
  }
  let error: any
  const cacheData = cache.get(name)
  if (cacheData) {
    if (ttl(cacheData.cacheTime) < cacheTTL) {
      console.log('read cache')
      return cacheData.data
    }

    else {
      cache.delete(name)
    }
  }

  try {
    const root = getWorkspaceFolderPath(window.activeTextEditor)!
    const data = await getPkg(name, root)

    if (data) {
      const result = {
        tags: data['dist-tags'],
        versions: Object.keys(data.versions || {}),
        // time: data.time,
        // raw: data,
      }

      cache.set(name, { data: result, cacheTime: now() })

      cacheChanged = true

      return result
    }
  }
  catch (e) {
    error = e
  }

  return {
    tags: {},
    versions: [],
    error: error?.statusCode?.toString() || error,
  }
}

export async function getPkg(pkg: string, cwd: string) {
  const registry = await getNpmRegistry(pkg, cwd).catch(() => null)

  if (!registry)
    return {}

  const pkgJSON = await ofetch<Record<string, any>>(`/${pkg}`, { baseURL: registry })

  return pkgJSON
}

const registryCache = new Map<string, string | null | undefined>()

export async function getNpmRegistry(pkg: string, cwd: string) {
  const key = `${pkg}+++${cwd}`
  if (registryCache.has(key))
    return registryCache.get(key)

  const cmd = 'npm config get registry'
  const scopedCmd = `npm config get ${pkg}:registry`
  const [defaultRegistry, scopedRegistry] = await Promise.all([
    execCmd(cmd, cwd).catch(() => null),
    execCmd(scopedCmd, cwd).catch(() => null),
  ])

  registryCache.set(key, scopedRegistry || defaultRegistry)
  return scopedRegistry || defaultRegistry
}
