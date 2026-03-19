import { readdirSync, cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

function findPyFiles(dir) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...findPyFiles(full));
		else if (entry.name.endsWith('.py')) files.push(full);
	}
	return files;
}

for (const src of findPyFiles('server/src')) {
	const dest = src.replace('server/src', 'server/built');
	mkdirSync(dirname(dest), { recursive: true });
	cpSync(src, dest);
	console.log(`Copied ${src} to ${dest}`);
}
