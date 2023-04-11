import {context} from '@actions/github'
import {Label} from '../types'
import {client, prNumber} from '../proxy'
import {isLabelPresent} from '../labels/utils'

let currentLabels: {name: string}[] = []

const labelCurrentlyInPullRequest = (label: {name: string}): boolean =>
  isLabelPresent(label, currentLabels)

async function cleanLabels(labelsToClean: Label[]): Promise<void> {
  for (const label of labelsToClean) {
    if (labelCurrentlyInPullRequest(label)) {
      await client.rest.issues.removeLabel({
        ...context.repo,
        issue_number: prNumber,
        name: label.name
      })
    }
  }
}

async function addLabel(label: Label) {
  await client.rest.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels: [label.name]
  })
}

async function loadCurrentLabels() {
  currentLabels = (
    await client.rest.pulls.get({...context.repo, pull_number: prNumber})
  ).data.labels
}

export const pullRequestHandler = {
  loadCurrentLabels,
  labelCurrentlyInPullRequest,
  cleanLabels,
  addLabel
}
