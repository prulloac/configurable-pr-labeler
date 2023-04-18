module.exports = {
	clearMocks: true,
	moduleFileExtensions: ['js', 'ts'],
	testMatch: ['**/*.test.ts'],
	transform: {
	  '^.+\\.ts$': 'ts-jest'
	},
	verbose: true,
	collectCoverage: true,
	collectCoverageFrom: [
		'**/*.{js,ts}',
		'!**/node_modules/**',
		'!**/lib/**',
		'!**/dist/**',
		'!**/coverage/**',
		'!jest.config.js',
	  ],
	coverageDirectory: "coverage",
	coverageThreshold: {
		global: {
		  branches: 60,
		  functions: 80,
		  lines: 80,
		  statements: 80,
		},
	  },
  }
