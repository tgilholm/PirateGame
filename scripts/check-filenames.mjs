import path from 'path';

const regex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/

const files = process.argv.slice(2);
let code = 0;

files.forEach((f) => {
    const fname = path.basename(f);

    if (fname.startsWith('.')) return;

    if (!regex.test(fname)) {
        console.error(`\x1b[31m%s\x1b[0m`, `Error: "${fname}" is not kebab-case.`);
        console.error(`   Rename to: ${fname.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')}`);
        code = 1;
    }
});

if (code === 0) {
    console.log('\x1b[32m%s\x1b[0m', 'All filenames are valid.');
}

process.exit(code);