import {run} from '../src/index'
import {getOctokit} from '@actions/github'
import * as core from '@actions/core'

const fs = jest.requireActual('fs')

jest.mock('@actions/core')
jest.mock('@actions/github')

const gh = getOctokit('_')
const addLabelsMock = jest.spyOn(gh.rest.issues, 'addLabels')
const removeLabelMock = jest.spyOn(gh.rest.issues, 'removeLabel')
const reposMock = jest.spyOn(gh.rest.repos, 'getContent')
const paginateMock = jest.spyOn(gh, 'paginate')
const getPullMock = jest.spyOn(gh.rest.pulls, 'get')
const listCommitsMock = jest.spyOn(gh.rest.pulls, 'listCommits')
const listLabelsForRepoMock = jest.spyOn(gh.rest.issues, 'listLabelsForRepo')
const createLabelMock = jest.spyOn(gh.rest.issues, 'createLabel')

const yamlFixtures = (name: string) => fs.readFileSync(`__tests__/fixtures/${name}`, 'utf8')

beforeAll(() => jest.spyOn(core, 'error').mockImplementation(message => console.error(message)))
afterAll(() => jest.restoreAllMocks())

describe('run', () => {
	it('adds labels to PRs that match our file patterns', async () => {
		usingLabelerConfigYaml('only_js.yml')
		mockGitHubResponseChangedFiles('foo.js')

		await run()

		expect(core.setFailed).toHaveBeenCalledTimes(0)
		expect(listLabelsForRepoMock).toHaveBeenCalledTimes(1)
		expect(getPullMock).toHaveBeenCalledTimes(1)
		expect(removeLabelMock).toHaveBeenCalledTimes(0)
		expect(addLabelsMock).toHaveBeenCalledTimes(1)
		expect(addLabelsMock).toHaveBeenCalledWith({
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['JS/TS']
		})
	})

	it('adds labels to PRs that match our pr title and body and branch name', async () => {
		usingLabelerConfigYaml('body_and_title.yml')
		mockGitHubResponseChangedFiles('foo.js')

		await run()

		expect(core.setFailed).toHaveBeenCalledTimes(0)
		expect(listLabelsForRepoMock).toHaveBeenCalledTimes(1)
		expect(getPullMock).toHaveBeenCalledTimes(1)
		expect(removeLabelMock).toHaveBeenCalledTimes(0)
		expect(addLabelsMock).toHaveBeenCalledTimes(3)
		expect(addLabelsMock).toHaveBeenNthCalledWith(1, {
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['title label']
		})
		expect(addLabelsMock).toHaveBeenNthCalledWith(2, {
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['body label']
		})
		expect(addLabelsMock).toHaveBeenNthCalledWith(3, {
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['branch label']
		})
	})

	it('adds labels to PRs that match the amount of changes introduced', async () => {
		usingLabelerConfigYaml('lines_files.yml')
		mockGitHubResponseChangedFiles('foo.js')

		await run()

		expect(core.setFailed).toHaveBeenCalledTimes(0)
		expect(listLabelsForRepoMock).toHaveBeenCalledTimes(1)
		expect(getPullMock).toHaveBeenCalledTimes(1)
		expect(removeLabelMock).toHaveBeenCalledTimes(0)
		expect(addLabelsMock).toHaveBeenCalledTimes(2)
		expect(addLabelsMock).toHaveBeenNthCalledWith(1, {
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['lines label']
		})
		expect(addLabelsMock).toHaveBeenNthCalledWith(2, {
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['files label']
		})
	})

	it('does not add labels to PRs that do not match our glob patterns', async () => {
		usingLabelerConfigYaml('only_js.yml')
		mockGitHubResponseChangedFiles('foo.txt')

		await run()

		expect(core.setFailed).toHaveBeenCalledTimes(0)
		expect(removeLabelMock).toHaveBeenCalledTimes(0)
		expect(addLabelsMock).toHaveBeenCalledTimes(0)
	})

	it('it deletes preexisting PR labels that no longer match the glob pattern', async () => {
		const mockInput: any = {
			token: 'foo',
			configuration_path: 'bar'
		}

		jest.spyOn(core, 'getInput').mockImplementation((name: string, ...opts) => mockInput[name])

		usingLabelerConfigYaml('only_js.yml')
		mockGitHubResponseChangedFiles('foo.txt')
		getPullMock.mockResolvedValue(<any>{
			data: {
				labels: [{name: 'JS/TS'}]
			}
		})

		await run()

		expect(core.setFailed).toHaveBeenCalledTimes(0)
		expect(addLabelsMock).toHaveBeenCalledTimes(0)
		expect(removeLabelMock).toHaveBeenCalledTimes(1)
		expect(removeLabelMock).toHaveBeenCalledWith({
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			name: 'JS/TS'
		})
	})

	it('multiple entries of the same label name are added only once', async () => {
		usingLabelerConfigYaml('multiple_entries.yml')
		mockGitHubResponseChangedFiles('foo.js')

		await run()

		expect(core.setFailed).toHaveBeenCalledTimes(0)
		expect(createLabelMock).toHaveBeenCalledTimes(1)
		expect(addLabelsMock).toHaveBeenCalledTimes(1)
		expect(addLabelsMock).toHaveBeenCalledWith({
			owner: 'monalisa',
			repo: 'helloworld',
			issue_number: 123,
			labels: ['important ⚠️']
		})
	})
})

function usingLabelerConfigYaml(fixtureName: string): void {
	reposMock.mockResolvedValue(<any>{
		data: {content: yamlFixtures(fixtureName), encoding: 'utf8'}
	})
	listLabelsForRepoMock.mockReturnValue(<any>{data: []})
}

function mockGitHubResponseChangedFiles(...files: string[]): void {
	const returnValue = files.map(f => ({filename: f}))
	getPullMock.mockReturnValue(<any>{
		data: {
			title: 'foo',
			body: 'bar',
			additions: 10,
			deletions: 0,
			changed_files: files.length,
			mergeable: true,
			rebaseable: true,
			labels: [],
			head: {
				ref: 'baz'
			}
		}
	})
	paginateMock.mockReturnValue(<any>returnValue)
	listCommitsMock.mockReturnValue(<any>{
		data: [
			{
				committer: {
					login: 'monalisa'
				}
			}
		]
	})
}
