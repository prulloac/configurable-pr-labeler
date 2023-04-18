import {getOctokit, context} from '@actions/github'
import {PullRequest} from '../../src/pullRequest/PullRequest'
import * as core from '@actions/core'

jest.mock('@actions/core')
jest.mock('@actions/github')

const gh = getOctokit('_')
const getPullMock = jest.spyOn(gh.rest.pulls, 'get')
const listCommitsMock = jest.spyOn(gh.rest.pulls, 'listCommits')
const paginateMock = jest.spyOn(gh, 'paginate')

afterEach(() => jest.restoreAllMocks())

describe('PullRequest', () => {
	describe('constructor', () => {
		it('sets client and PR number', () => {})

		it('fail to instantiate because is not a PR', () => {
			context.payload.pull_request = undefined

			try {
				const pr = new PullRequest(gh)
			} catch (e: any) {
				expect(e.message).toEqual('Cannot instantiate PullRequest if context is not pull_request')
			}

			context.payload.pull_request = {number: 123}
		})
	})

	describe('load', () => {
		it('loads the PR metadata', async () => {
			mockPullRequest()

			const pr = new PullRequest(gh)
			await pr.load()
			expect(pr.number).toBeDefined()
		})
	})

	describe('addLabel', () => {
		it('adds a label to the PR', async () => {
			mockPullRequest()

			const pr = new PullRequest(gh)
			await pr.load()
			await pr.addLabel({name: 'foo'})
			expect(gh.rest.issues.addLabels).toHaveBeenCalledWith({
				owner: 'monalisa',
				repo: 'helloworld',
				issue_number: 123,
				labels: ['foo']
			})
		})
	})
})

function mockPullRequest() {
	getPullMock.mockResolvedValue(<any>{
		data: {
			number: 123,
			labels: [
				{
					name: 'foo'
				}
			]
		}
	})
	listCommitsMock.mockResolvedValue(<any>{
		data: [
			{
				committer: {
					login: 'monalisa'
				}
			}
		]
	})
	paginateMock.mockResolvedValue(<any>[{filename: 'foo.js'}])
}
