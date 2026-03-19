// @ts-nocheck
const unusedImports = require('eslint-plugin-unused-imports');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js'],
		languageOptions: { parser: tsParser },
		plugins: { 'unused-imports': unusedImports },
		rules: {
			'unused-imports/no-unused-imports': 'error',
		},
	},
];
