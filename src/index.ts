import {setFailed} from '@actions/core'
import {context} from '@actions/github'
import {createOrUpdateLabels} from './labels/handler'
import * as labelUtils from './labels/utils'
import {pullRequestHandler} from './pullRequest/handler'
import {Label, LogicalLabel} from './types'
import {input, client, prNumber} from './proxy'

async function handleSizeLabels(changeSize: number, labelsString: string) {
  const complexityLabel: Label = labelUtils.getLabelForChangeSize(
    changeSize,
    labelsString
  )
  if (!pullRequestHandler.labelCurrentlyInPullRequest(complexityLabel)) {
    const possibleLabels: Label[] = labelUtils.parseLabels(labelsString)
    await pullRequestHandler.cleanLabels(possibleLabels)
    await pullRequestHandler.addLabel(complexityLabel)
  }
}

async function handleRegexLabels(
  scanTarget: string,
  regularExpressionLabels: string
) {
  const possibleLabels: LogicalLabel[] =
    labelUtils.getPossibleRegularExpressionLabels(regularExpressionLabels)
  const matchingLabels: Label[] = labelUtils.getMatchingRegularExpressionLabels(
    scanTarget,
    possibleLabels
  )
  if (matchingLabels.length > 0) {
    await pullRequestHandler.cleanLabels(possibleLabels)
    for (const label of matchingLabels) {
      pullRequestHandler.addLabel(label)
    }
  }
}

async function run(): Promise<void> {
  try {
    if (prNumber === 0) {
      throw new Error(`This Action is only supported on 'pull_request' events.`)
    }
    await pullRequestHandler.loadCurrentLabels()
    const {title, body, additions, deletions, changed_files} = (
      await client.rest.pulls.get({...context.repo, pull_number: prNumber})
    ).data
    await createOrUpdateLabels(input.complexityLabels)
    await createOrUpdateLabels(input.sizeLabels)
    if (input.useComplexityLabels) {
      await handleSizeLabels(additions + deletions, input.complexityLabels)
    }
    if (input.useSizeLabels) {
      await handleSizeLabels(changed_files, input.sizeLabels)
    }
    if (input.useBodyMetadataLabels && (body?.length || 0) > 1) {
      await handleRegexLabels(`${body}`, input.titleMetadataLabels)
    }
    if (input.useTitleMetadataLabels && (title?.length || 0) > 1) {
      await handleRegexLabels(title, input.titleMetadataLabels)
    }
  } catch (error: any) {
    setFailed(error.message)
  }
}

run()
