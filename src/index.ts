import {info, getInput, setFailed, getBooleanInput} from '@actions/core'
import {context} from '@actions/github'
import {GitHub, getOctokitOptions} from '@actions/github/lib/utils'
import {sizeLabelHandlers} from './labelsHandler'
import {pullRequestHandler} from './pullRequestHandler'
import {Input, Label} from './types'

const input: Input = {
  token: getInput('token', {required: true}),
  useSizeLabels: getBooleanInput('useSizeLabels', {required: false}),
  useBodyMetadataLabels: getBooleanInput('useBodyMetadataLabels', {
    required: false
  }),
  sizeLabels: getInput('sizeLabels', {required: false}),
  bodyMetadataLabels: getInput('bodyMetadataLabels', {required: false})
}

async function run(): Promise<void> {
  try {
    if (context.payload.pull_request == null) {
      throw new Error(`This Action is only supported on 'pull_request' events.`)
    }
    const prNumber: number = context.payload.pull_request.number
    const client = new GitHub(getOctokitOptions(input.token))
    const {title, body, additions, deletions} = (
      await client.rest.pulls.get({...context.repo, pull_number: prNumber})
    ).data
    if (input.useSizeLabels) {
      await sizeLabelHandlers.createOrUpdateLabels(
        input.token,
        input.sizeLabels
      )
      const linesChanged = additions + deletions
      info(
        `additions: ${additions}, deletions: ${deletions}, linesChanged: ${linesChanged}`
      )
      await pullRequestHandler.cleanLabels(
        input.token,
        prNumber,
        sizeLabelHandlers.parseLabelsFromFormattedString(input.sizeLabels)
      )
      const sizeLabel: Label | undefined =
        sizeLabelHandlers.getLabelForLinesChanged(
          linesChanged,
          input.sizeLabels
        )
      if (sizeLabel === undefined) {
        throw new Error(
          `Unexpected error while retrieving label for pull request.`
        )
      }
      await pullRequestHandler.addLabel(input.token, prNumber, sizeLabel)
    }
    if (input.useBodyMetadataLabels) {
      await sizeLabelHandlers.createOrUpdateLabels(
        input.token,
        input.bodyMetadataLabels
      )
    }
    info(`PR Title: ${title}`)
    info(`PR Body: ${body}`)
  } catch (error: any) {
    setFailed(error.message)
  }
}

run()
