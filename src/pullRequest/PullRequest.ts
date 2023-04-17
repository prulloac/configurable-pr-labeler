import {info} from '@actions/core'
import {context} from '@actions/github'
import {ConditionalLabel, RepoLabel, ClientType} from '../types'
import {Minimatch} from 'minimatch'

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

	private regexMatch(scanTarget: string, pattern: string): boolean {
		const condition: string = new RegExp(/(?<=\/).*(?=\/)/).exec(pattern)?.[0] || ''
		const flags: string | undefined = new RegExp(/\/.{0,3}$/).exec(pattern)?.[0].replace('/', '')
		info(`testing with condition: ${condition} and flags: ${flags}`)
		const regExpFromLabel: RegExp = flags ? new RegExp(condition, flags) : new RegExp(condition)
		return regExpFromLabel.test(scanTarget)
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
		if (condition.title) {
			info(`checking for title regex: ${condition.title}`)
			return this.regexMatch(this.title, condition.title)
		}
		if (condition.body) {
			info(`checking for body regex: ${condition.body}`)
			return this.regexMatch(this.body, condition.body)
		}
		if (condition.files) {
			info(`checking for files pattern: ${condition.files}`)
			const matchers = (condition.files as string[]).map(p => new Minimatch(p))
			return this.filesChanged.files.some(file => matchers.some(matcher => matcher.match(file)))
		}
		if (condition.mergeable) {
			info(`checking if pr is mergeable: ${condition.mergeable}`)
			return this.mergeable === condition.mergeable
		}
		if (condition.rebaseable) {
			info(`checking if pr is rebaseable: ${condition.rebaseable}`)
			return this.rebaseable === condition.rebaseable
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
