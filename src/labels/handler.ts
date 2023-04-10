import {context} from '@actions/github'
import {Label} from '../types'
import {client} from '../proxy'
import {parseLabels} from './formatter'

async function getLabelsForRepo(): Promise<Label[]> {
  const {data} = await client.rest.issues.listLabelsForRepo(context.repo)
  return data.map(
    label =>
      ({
        name: label.name,
        description: label.description,
        color: label.color
      } as Label)
  )
}

async function createLabelIfNotPresent(
  label: Label,
  currentLabels: Label[]
): Promise<Label | undefined> {
  if (
    !currentLabels.find(
      query => query.name.toLocaleLowerCase() === label.name.toLocaleLowerCase()
    )
  ) {
    const {data} = await client.rest.issues.createLabel({
      ...context.repo,
      ...label
    })
    return data as Label
  }
  return undefined
}

export async function createOrUpdateLabels(
  formattedLabels: string
): Promise<Label[]> {
  const availableLabelsAtBegining: Label[] = await getLabelsForRepo()
  const requiredLabels: Label[] = parseLabels(formattedLabels)
  for (const label of requiredLabels) {
    createLabelIfNotPresent(label, availableLabelsAtBegining)
  }
  const availableLabelsAtEnd: Label[] = await getLabelsForRepo()
  return availableLabelsAtEnd
}
