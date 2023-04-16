import {getInput, setFailed} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {PullRequest} from './pullRequest/PullRequest'
import {ConditionalLabel, RepoLabel} from './labels/types'
import {load as loadYaml} from 'js-yaml'

type ClientType = ReturnType<typeof getOctokit>
class ConfigurationType {
  labels!: ConditionalLabel[]
}

function parseConfigObject(configObject: any): ConditionalLabel[] {
  const config: ConditionalLabel[] = new Array<ConditionalLabel>()
  if (!(configObject instanceof ConfigurationType)) {
    throw Error('Configuration does not have labels key')
  }
  for (const label of configObject.labels) {
    config.push(label)
  }
  return config
}

async function fetchConfig(
  client: ClientType,
  configFilePath: string
): Promise<ConditionalLabel[]> {
  const response: any = await client.rest.repos.getContent({
    repo: context.repo.repo,
    owner: context.repo.owner,
    ref: context.sha,
    path: configFilePath
  })
  const configString: string = Buffer.from(
    response.data.content,
    response.data.encoding
  ).toString()
  const configObject: any = loadYaml(configString)
  return parseConfigObject(configObject)
}

async function loadPullRequestData(client: ClientType): Promise<PullRequest> {
  const pullRequest: PullRequest = new PullRequest(client)
  await pullRequest.load()
  return pullRequest
}

async function syncLabels(client: ClientType, config: ConditionalLabel[]) {
  const {data} = await client.rest.issues.listLabelsForRepo({...context.repo})
  const currentLabels = data.map(repoLabel => repoLabel.name)
  for (const label of config) {
    if (currentLabels.includes(label.name)) {
      continue
    }
    const usableArgs: RepoLabel = {...label}
    await client.rest.issues.createLabel({...context.repo, ...usableArgs})
  }
}

async function run(): Promise<void> {
  try {
    const client: ClientType = getOctokit(getInput('token', {required: true}))
    const config: ConditionalLabel[] = await fetchConfig(
      client,
      getInput('configuration_path', {required: false})
    )
    await syncLabels(client, config)
    const pullRequest: PullRequest = await loadPullRequestData(client)
    await pullRequest.apply(config)
  } catch (error: any) {
    setFailed(error.message)
  }
}

run()
