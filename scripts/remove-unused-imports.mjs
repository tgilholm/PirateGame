import { execSync } from 'child_process';
import process from 'process';

const files = process.argv.slice(2);
if (files.length === 0) process.exit(0); // nothing to remove

// Remove using eslint
const fileArgs = files.map((f) => `"${f}"`).join(' ');
execSync(`eslint --fix --debug ${fileArgs}`, { stdio: 'inherit' });
