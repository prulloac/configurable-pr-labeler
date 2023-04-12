import {context} from '@actions/github'
import {Label} from '../types'
import {client} from '../proxy'
import {isLabelPresent, parseLabels} from './utils'

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
  if (!isLabelPresent(label, currentLabels)) {
    const {data} = await client.rest.issues.createLabel({
      ...context.repo,
      name: label.name,
      color: label.color,
      description: label.description || undefined
    })
    return new Label(data.name, data.color, data.description)
  }
  return undefined
}

export async function createOrUpdateLabels(
  formattedLabels: string
): Promise<Label[]> {
  if (formattedLabels?.length > 1) {
    const availableLabelsAtBegining: Label[] = await getLabelsForRepo()
    const requiredLabels: Label[] = parseLabels(formattedLabels)
    for (const label of requiredLabels) {
      createLabelIfNotPresent(label, availableLabelsAtBegining)
    }
    const availableLabelsAtEnd: Label[] = await getLabelsForRepo()
    return availableLabelsAtEnd
  }
  return []
}
