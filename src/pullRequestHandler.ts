import {context} from '@actions/github'
import {GitHub, getOctokitOptions} from '@actions/github/lib/utils'
import {Label} from './types'

async function cleanLabels(
  token: string,
  prNumber: number,
  labelsToClean: Label[]
): Promise<void> {
  const client = new GitHub(getOctokitOptions(token)).rest
  const {data} = await client.pulls.get({
    ...context.repo,
    pull_number: prNumber
  })
  for (const label of labelsToClean) {
    if (
      data.labels.find(
        query =>
          query.name.toLocaleLowerCase() === label.name.toLocaleLowerCase()
      )
    ) {
      await client.issues.removeLabel({
        ...context.repo,
        issue_number: prNumber,
        name: label.name
      })
    }
  }
}

async function addLabel(token: string, prNumber: number, label: Label) {
  const client = new GitHub(getOctokitOptions(token)).rest
  await client.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels: [label.name]
  })
}

export const pullRequestHandler = {cleanLabels, addLabel}
