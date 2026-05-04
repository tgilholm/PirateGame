import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

const mapPath = path.join(process.cwd(), 'shared/built/map.json');
const outputPath = path.join(process.cwd(), 'shared/browser/map.json.gz');

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

const input = fs.createReadStream(mapPath);
const output = fs.createWriteStream(outputPath);
const gzip = zlib.createGzip({ level: 9 });

input.pipe(gzip).pipe(output);

output.on('finish', () => {
	console.log(`Compressed map successfully at ${outputPath}`);
	process.exit(0);
});

output.on('error', (err) => {
	console.log(`Gzip compression failed ${err}`);
	process.exit(1);
});
