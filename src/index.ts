import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {PullRequest} from './pullRequest/PullRequest'
import {ClientType, ConditionalLabel} from './types'
import {load as loadYaml} from 'js-yaml'

function parseConfigObject(configObject: any): ConditionalLabel[] {
	if (!Object.keys(configObject).includes('labels')) {
		core.warning(`input readed as: ${JSON.stringify(configObject)}`)
		throw Error('Configuration does not have labels key')
	}
	const config: ConditionalLabel[] = new Array<ConditionalLabel>()
	for (const label of configObject.labels) {
		const keys = Object.keys(label)
		if (keys.includes('name') && keys.includes('conditions')) {
			config.push(label as ConditionalLabel)
		} else {
			core.warning(`input readed as: ${JSON.stringify(label)}`)
			throw Error('ConditionalLabel not instantiable')
		}
	}
	return config
}

async function fetchConfigLabels(client: ClientType, configFilePath: string): Promise<ConditionalLabel[]> {
	const response: any = await client.rest.repos.getContent({
		repo: context.repo.repo,
		owner: context.repo.owner,
		ref: context.sha,
		path: configFilePath
	})
	const configString: string = Buffer.from(response.data.content, response.data.encoding).toString()
	const configObject: any = loadYaml(configString)
	return parseConfigObject(configObject)
}

async function loadPullRequestData(client: ClientType): Promise<PullRequest> {
	const pullRequest: PullRequest = new PullRequest(client)
	await pullRequest.load()
	return pullRequest
}

async function syncLabels(client: ClientType, newLabels: ConditionalLabel[]) {
	const {data} = await client.rest.issues.listLabelsForRepo({...context.repo})
	const currentLabels = data.map(repoLabel => repoLabel.name)
	const newLabelsEntries: string[] = newLabels
		.map(label => label.name.trim())
		.reduce((acc, label) => {
			if (!acc.includes(label)) {
				acc.push(label)
			}
			return acc
		}, new Array<string>())
	for (const newLabelEntry of newLabelsEntries) {
		if (!currentLabels.includes(newLabelEntry)) {
			core.info(`creating label: ${newLabelEntry} with : ${JSON.stringify(newLabelEntry)}`)
			await client.rest.issues.createLabel({...context.repo, name: newLabelEntry})
		}
	}
}

export async function run(): Promise<void> {
	try {
		const client: ClientType = getOctokit(core.getInput('token', {required: true}))
		const config: ConditionalLabel[] = await fetchConfigLabels(
			client,
			core.getInput('configuration_path', {required: false})
		)
		await syncLabels(client, config)
		const pullRequest: PullRequest = await loadPullRequestData(client)
		await pullRequest.apply(config)
	} catch (error: any) {
		core.error(error.stack)
		core.setFailed(error.message)
	}
}

run()
