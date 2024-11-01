const wtf = require('wtfnode');
const jest = require('jest');

async function runTests() {
	// Run Jest tests
	await jest.run(['--config', './test/integration/jest.config.js']);

	// Log open handles if Jest doesn't exit
	console.log('Testing completed. Checking for open handles...');
	wtf.dump();
}

runTests();
