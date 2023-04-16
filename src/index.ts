import {getInput, info, setFailed, warning} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {PullRequest} from './pullRequest/PullRequest'
import {ClientType, ConditionalLabel, RepoLabel} from './types'
import {load as loadYaml} from 'js-yaml'
import {unemojify} from 'node-emoji'

function parseConfigObject(configObject: any): ConditionalLabel[] {
	const config: ConditionalLabel[] = new Array<ConditionalLabel>()
	if (!Object.keys(configObject).includes('labels')) {
		warning(`input readed as: ${JSON.stringify(configObject)}`)
		throw Error('Configuration does not have labels key')
	}
	for (const label of configObject.labels) {
		const keys = Object.keys(label)
		if (keys.includes('name') && keys.includes('conditions')) {
			config.push(label as ConditionalLabel)
		} else {
			warning(`input readed as: ${JSON.stringify(label)}`)
			throw Error('ConditionalLabel not instantiable')
		}
	}
	return config
}

async function fetchConfig(client: ClientType, configFilePath: string): Promise<ConditionalLabel[]> {
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

async function syncLabels(client: ClientType, config: ConditionalLabel[]) {
	const {data} = await client.rest.issues.listLabelsForRepo({...context.repo})
	const currentLabels = data.map(repoLabel => repoLabel.name)
	const uniqueEntries = new Set(
		config.map(conditionalLabel => {
			const labelName = unemojify(conditionalLabel.name)
			return {
				name: labelName,
				color: conditionalLabel.color?.replace('#', '') || undefined,
				description: conditionalLabel.description || undefined
			} as RepoLabel
		})
	)
	for (const label of uniqueEntries) {
		if (currentLabels.includes(label.name)) {
			continue
		}
		info(`creating label: ${label.name} with : ${JSON.stringify(label)}`)
		await client.rest.issues.createLabel({...context.repo, ...label})
	}
}

async function run(): Promise<void> {
	try {
		const client: ClientType = getOctokit(getInput('token', {required: true}))
		const config: ConditionalLabel[] = await fetchConfig(client, getInput('configuration_path', {required: false}))
		await syncLabels(client, config)
		const pullRequest: PullRequest = await loadPullRequestData(client)
		await pullRequest.apply(config)
	} catch (error: any) {
		setFailed(error.message)
	}
}

run()
