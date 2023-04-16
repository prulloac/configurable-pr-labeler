import {context, getOctokit} from '@actions/github'
import {ConditionalLabel, RepoLabel} from '../labels/types'

type ClientType = ReturnType<typeof getOctokit>
interface FilesChanged {
  files: string[]
  quantity: number
}

export class PullRequest {
  apply(config: ConditionalLabel[]) {
    throw new Error('Method not implemented.')
  }
  number!: number
  title!: string
  body!: string
  filesChanged!: FilesChanged
  labels!: RepoLabel[]
  linesChanged!: number
  mergeable!: boolean
  rebaseable!: boolean
  author!: string
  client: ClientType

  constructor(client: ClientType) {
    this.client = client
    if (!context.payload.pull_request) {
      throw Error(
        'Cannot instantiate PullRequest if context is not pull_request'
      )
    }
    this.number = context.payload.pull_request.number
  }

  async load() {
    const {data: metaData} = await this.client.rest.pulls.get({
      ...context.repo,
      pull_number: this.number
    })
    this.body = `${metaData.body}`
    this.title = metaData.title
    this.linesChanged = metaData.additions + metaData.deletions
    this.labels = metaData.labels.map(v => ({
      name: v.name,
      color: v.color,
      description: v.description || undefined
    }))
    this.mergeable = metaData.mergeable ?? false
    this.rebaseable = metaData.rebaseable ?? false
    this.filesChanged.quantity = metaData.changed_files
    const {data: commitData} = await this.client.rest.pulls.listCommits({
      ...context.repo,
      pull_number: this.number
    })
    this.author = `${commitData[0].committer?.login}`
    const {data: filesData} = await this.client.rest.pulls.listFiles({
      ...context.repo,
      pull_number: this.number
    })
    this.filesChanged.files = filesData.map(fileData => fileData.filename)
  }

  async addLabel(label: RepoLabel) {
    await this.client.rest.issues.addLabels({
      ...context.repo,
      issue_number: this.number,
      labels: [label.name]
    })
  }
}
