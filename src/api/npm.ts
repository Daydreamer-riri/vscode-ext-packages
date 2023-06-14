import { workspace } from 'vscode'
import pacote from 'pacote'
import { execCmd } from '../utils/cmd'
import { createReg } from '../utils/reg'
import type { PackageData } from '../types'
import { fetch } from './fetch'
import { getNpmConfig } from './config'

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

export async function getPackageData(name: string): Promise<PackageData> {
  let error: any
  const cacheData = cache.get(name)
  if (cacheData) {
    if (ttl(cacheData.cacheTime) < cacheTTL)
      return cacheData.data

    else
      cache.delete(name)
  }

  try {
    const npmConfig = await getNpmConfig()
    const data = await pacote.packument(name, { ...npmConfig, fullMetadata: true })

    if (data) {
      const result = {
        tags: data['dist-tags'],
        versions: Object.keys(data.versions || {}),
        time: data.time,
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

const latestPkgCache = new Map()
const validPeriod = 30000
export async function getLatestPkg(pkg: string, cwd: string) {
  const registry = await getNpmRegistry(pkg, cwd).catch(() => null)
  if (!registry)
    return null

  if (latestPkgCache.has(pkg))
    return latestPkgCache.get(pkg)

  const pkgURL = new URL(`/${pkg}/latest`, registry)
  const pkgJSON = await fetch(pkgURL.href)
  latestPkgCache.set(pkg, pkgJSON)
  setTimeout(() => latestPkgCache.delete(pkg), validPeriod)
  return pkgJSON
}

export async function getNpmRegistry(pkg: string, cwd: string) {
  const cmd = 'npm config get registry'
  const scopedCmd = `npm config get ${pkg}:registry`
  const [defaultRegistry, scopedRegistry] = await Promise.all([
    execCmd(cmd, cwd).catch(() => null),
    execCmd(scopedCmd, cwd).catch(() => null),
  ])
  return scopedRegistry || defaultRegistry
}

/** bundlephobia only supports npmjs.com packages */
const bundlePhobiaCache = new Map()
export async function getBundlePhobiaPkg(pkgName: string, pkgVersion?: string) {
  const pkgNameConf: string | undefined = workspace.getConfiguration('pkg.inspector').get('disableBundlephobia')
  if (pkgNameConf && createReg(pkgNameConf).test(pkgName))
    return

  const pkg = pkgVersion ? `${pkgName}@${pkgVersion}` : pkgName
  if (bundlePhobiaCache.has(pkg))
    return bundlePhobiaCache.get(pkg)

  const result = await fetch(`https://bundlephobia.com/api/size?package=${pkg}&record=true`)
  bundlePhobiaCache.set(pkg, result)
  return result
}
