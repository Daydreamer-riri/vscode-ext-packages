import { CompletionItem, CompletionItemKind, CompletionList } from 'vscode'
import compareVersions from '../semver/compareVersion'
import { sortText } from '../providers/autoCompletion'
import { statusBarItem } from '../ui/indicators'
import { type PackageData, freshChecker } from '../api'
import { getRoot } from '../utils/resolve'
import type Item from './Item'
import type Dependency from './Dependency'
import { getPackageDatas } from './worker'

export async function fetchPackageVersions(
  dependencies: Item[],
): Promise<[Dependency[], Map<string, Dependency[]>]> {
  statusBarItem.setText('👀 Fetching npm')

  const responsesMap: Map<string, Dependency[]> = new Map()

  const packageData = await fetchPackageData(dependencies)

  const responses = dependencies.map(
    (item, index) => {
      try {
        const data = packageData[index]
        if (!data)
          throw new Error('Get Package information failure')

        const versions = data.version
          .reduce((total: string[], item) => {
            if (!item.includes('-'))
              total.push(item)
            return total
          }, [])
          .sort(compareVersions)
          .reverse()
        let i = 0
        const versionCompletionItems = new CompletionList(
          versions.map((version) => {
            const completionItem = new CompletionItem(
              version,
              CompletionItemKind.Class)
            completionItem.preselect = i === 0
            completionItem.sortText = sortText(i++)
            return completionItem
          }),
          true)
        const dependency = {
          item,
          versions,
          info: data.info,
          versionCompletionItems,
        }
        const found = responsesMap.get(item.key)
        if (found)
          found.push(dependency)

        else
          responsesMap.set(item.key, [dependency])
        return dependency
      }
      catch (error) {
        console.error(error)
        return {
          item,
          error: `${item.key}: ${error}`,
        }
      }
    },
  )

  return [responses, responsesMap]
}

async function fetchPackageData(
  dependencies: Item[],
): Promise<PackageData[]> {
  const root = getRoot()

  const packageDatas = await getPackageDatas(dependencies, root)

  freshChecker.set(false)

  return packageDatas
}
