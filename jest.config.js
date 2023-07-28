module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	verbose: true,
	rootDir: 'src/',
	globalSetup: process.env.INTEGRATION_TEST !== 'true' ? '../node_modules/@shelf/jest-dynamodb/lib/setup.js' : undefined,
	globalTeardown:
		process.env.INTEGRATION_TEST !== 'true' ? '../node_modules/@shelf/jest-dynamodb/lib/teardown.js' : undefined
};
