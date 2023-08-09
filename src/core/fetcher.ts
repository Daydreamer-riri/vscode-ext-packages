import { CompletionItem, CompletionItemKind, CompletionList } from 'vscode'
import PQueue from 'p-queue'
import { getPackageData } from '../api'
import compareVersions from '../semver/compareVersion'
import { sortText } from '../providers/autoCompletion'
import { statusBarItem } from '../ui/indicators'
import type Item from './Item'
import type Dependency from './Dependency'

const queue = new PQueue({ concurrency: 10 })

export function fetchPackageVersions(
  dependencies: Item[],
): [Promise<Dependency[]>, Map<string, Dependency[]>] {
  statusBarItem.setText('👀 Fetching npm')

  const responsesMap: Map<string, Dependency[]> = new Map()

  const responses: Promise<Dependency>[] = dependencies.map(
    async (item) => {
      try {
        const data = await queue.add(() => getPackageData(item))
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

  return [Promise.all(responses), responsesMap]
}
