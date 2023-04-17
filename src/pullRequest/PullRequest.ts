import {info} from '@actions/core'
import {context} from '@actions/github'
import {ConditionalLabel, RepoLabel, ClientType} from '../types'

interface FilesChanged {
	files: string[]
	quantity: number
}

export class PullRequest {
	number!: number
	title!: string
	body!: string
	filesChanged: FilesChanged = {quantity: 0, files: []}
	labels!: string[]
	linesChanged!: number
	mergeable!: boolean
	rebaseable!: boolean
	author!: string
	client: ClientType

	constructor(client: ClientType) {
		this.client = client
		if (!context.payload.pull_request) {
			throw Error('Cannot instantiate PullRequest if context is not pull_request')
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
		this.labels = metaData.labels.map(v => v.name)
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

	async removeLabel(label: RepoLabel) {
		if (this.labels.find(prLabel => prLabel === label.name)) {
			info(`removing label ${label.name} from pull request`)
			this.client.rest.issues.removeLabel({...context.repo, issue_number: this.number, name: label.name})
		}
	}

	private checkCondition(condition: any): boolean {
		if (condition.maxLines) {
			info(`checking for maxLines: ${condition.maxLines}`)
			return this.linesChanged < condition.maxLines
		}
		if (condition.minLines) {
			info(`checking for minLines: ${condition.minLines}`)
			return this.linesChanged >= condition.minLines
		}
		if (condition.maxFiles) {
			info(`checking for maxFiles: ${condition.maxFiles}`)
			return this.filesChanged.quantity < condition.maxFiles
		}
		if (condition.minFiles) {
			info(`checking for minFiles: ${condition.minFiles}`)
			return this.filesChanged.quantity >= condition.minFiles
		}
		return false
	}

	async apply(config: ConditionalLabel[]) {
		for (const label of config) {
			if (label.conditions.every(condition => this.checkCondition(condition))) {
				await this.addLabel(label as RepoLabel)
			} else {
				await this.removeLabel(label as RepoLabel)
			}
		}
	}
}
