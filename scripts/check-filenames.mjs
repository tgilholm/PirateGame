import path from 'path';

const regex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;

const files = process.argv.slice(2);
let code = 0;

files.forEach((f) => {
	const fname = path.basename(f);

	if (fname.startsWith('.')) return;

	if (!regex.test(fname)) {
		console.error(`Error: "${fname}" is not kebab-case.`);
		console.error(`   Rename to: ${fname.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')}`);
		code = 1;
	}
});

if (code === 0) {
	console.log('All filenames are valid.');
}

process.exit(code);
