import {info, getInput, setFailed, getBooleanInput} from '@actions/core'
import {context} from '@actions/github'
import {GitHub, getOctokitOptions} from '@actions/github/lib/utils'
import {sizeLabelHandlers} from './labelsHandler'
import {pullRequestHandler} from './pullRequestHandler'
import {Input, Label} from './types'

const input: Input = {
  token: getInput('token', {required: true}),
  useComplexityLabels: getBooleanInput('useComplexityLabels', {
    required: false
  }),
  useSizeLabels: getBooleanInput('useSizeLabels', {required: false}),
  useBodyMetadataLabels: getBooleanInput('useBodyMetadataLabels', {
    required: false
  }),
  useTitleMetadataLabels: getBooleanInput('useBodyMetadataLabels', {
    required: false
  }),
  complexityLabels: getInput('complexityLabels', {required: false}),
  sizeLabels: getInput('sizeLabels', {required: false}),
  bodyMetadataLabels: getInput('bodyMetadataLabels', {required: false}),
  titleMetadataLabels: getInput('titleMetadataLabels', {required: false})
}

async function handleSizeLabels(
  prNumber: number,
  changeSize: number,
  labelsString: string
) {
  await sizeLabelHandlers.createOrUpdateLabels(input.token, labelsString)
  await pullRequestHandler.cleanLabels(
    input.token,
    prNumber,
    sizeLabelHandlers.parseLabelsFromFormattedString(labelsString)
  )
  const complexityLabel: Label | undefined =
    sizeLabelHandlers.getLabelForChangeSize(changeSize, labelsString)
  if (complexityLabel === undefined) {
    throw new Error(`Unexpected error while retrieving label for pull request.`)
  }
  await pullRequestHandler.addLabel(input.token, prNumber, complexityLabel)
}

async function run(): Promise<void> {
  try {
    if (context.payload.pull_request == null) {
      throw new Error(`This Action is only supported on 'pull_request' events.`)
    }
    const prNumber: number = context.payload.pull_request.number
    const client = new GitHub(getOctokitOptions(input.token)).rest
    const {title, body, additions, deletions, changed_files} = (
      await client.pulls.get({...context.repo, pull_number: prNumber})
    ).data
    if (input.useComplexityLabels) {
      await handleSizeLabels(
        prNumber,
        additions + deletions,
        input.complexityLabels
      )
    }
    if (input.useSizeLabels) {
      await handleSizeLabels(prNumber, changed_files, input.sizeLabels)
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
