import {info, setFailed} from '@actions/core'
import {context} from '@actions/github'
import {createOrUpdateLabels} from './labels/handler'
import {getLabelForChangeSize, parseLabels} from './labels/formatter'
import {pullRequestHandler} from './pullRequest/handler'
import {Label} from './types'
import {input, client, prNumber} from './proxy'

async function handleSizeLabels(changeSize: number, labelsString: string) {
  await createOrUpdateLabels(labelsString)
  const complexityLabel: Label = getLabelForChangeSize(changeSize, labelsString)
  if (!pullRequestHandler.labelCurrentlyInPullRequest(complexityLabel)) {
    const possibleLabels: Label[] = parseLabels(labelsString)
    await pullRequestHandler.cleanLabels(possibleLabels)
    await pullRequestHandler.addLabel(complexityLabel)
  }
}

async function run(): Promise<void> {
  try {
    if (prNumber === 0) {
      throw new Error(`This Action is only supported on 'pull_request' events.`)
    }
    pullRequestHandler.loadCurrentLabels()
    const {title, body, additions, deletions, changed_files} = (
      await client.rest.pulls.get({...context.repo, pull_number: prNumber})
    ).data
    if (input.useComplexityLabels) {
      await handleSizeLabels(additions + deletions, input.complexityLabels)
    }
    if (input.useSizeLabels) {
      await handleSizeLabels(changed_files, input.sizeLabels)
    }
    if (input.useBodyMetadataLabels) {
      info(`${body}`)
    }
    if (input.useTitleMetadataLabels) {
      info(`${title}`)
    }
  } catch (error: any) {
    setFailed(error.message)
  }
}

run()
