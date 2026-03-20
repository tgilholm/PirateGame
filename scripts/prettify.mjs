import { execSync } from 'child_process';
import process from 'process';

const files = process.argv.slice(2);

if (files.length === 0) process.exit(0); // no need to prettify
const fileArgs = files.map((f) => `"${f}"`).join(' '); // prep for prettifier

// exec with cache to save performance
execSync(`prettier --write --cache  ${fileArgs}`, { stdio: 'inherit' });
