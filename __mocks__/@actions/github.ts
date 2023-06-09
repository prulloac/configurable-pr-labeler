export const context = {
	payload: {
		pull_request: {
			number: 123
		}
	},
	repo: {
		owner: 'monalisa',
		repo: 'helloworld'
	}
}

const mockApi = {
	rest: {
		issues: {
			addLabels: jest.fn(),
			removeLabel: jest.fn(),
			listLabelsForRepo: jest.fn(),
			createLabel: jest.fn()
		},
		pulls: {
			get: jest.fn().mockResolvedValue({}),
			listFiles: {
				endpoint: {
					merge: jest.fn().mockReturnValue({})
				}
			},
			listCommits: jest.fn().mockResolvedValue({})
		},
		repos: {
			getContent: jest.fn()
		}
	},
	paginate: jest.fn()
}

export const getOctokit = jest.fn().mockImplementation(() => mockApi)
