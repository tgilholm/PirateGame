import * as path from 'path';
import fs from 'fs';
import { buildPathSpline } from '../server/src/utils/catmull-rom';
import { createPlot } from './plot';
import { getObjectsFromLayer } from '../server/src/utils/tiles';

const TILEMAP_PATH = path.join(__dirname, '../shared/map.json');
const LAYER_NAME = 'path-nodes';

async function main() {
	// Read from the tilemap
	const mapData = JSON.parse(fs.readFileSync(TILEMAP_PATH, 'utf-8'));

	const raw = getObjectsFromLayer(mapData, LAYER_NAME);
	console.log(`Found ${raw.length} path nodes`);

	// sort into individual paths
	let npcPaths: Map<string, Array<{ x: number; y: number }>> = new Map();
	raw?.forEach((node) => {
		// add if not already
		if (!npcPaths.has(node.type)) {
			npcPaths.set(node.type, [{ x: node.x, y: node.y }]);
			console.log(`Adding node ${node.x}, ${node.y} to ${node.type}`);
		} else {
			npcPaths.get(node.type)?.push({ x: node.x, y: node.y });
		}
	});

	console.log(`Sorted into ${npcPaths.size} paths`);

	npcPaths.forEach((value, key) => {
		const spline = buildPathSpline(value, 0.5, 25, true);

		console.log(`Created ${spline.length} spline nodes. Outputting to ${key}.png`);
		createPlot({
			x: spline.map((n) => n.x),
			y: spline.map((n) => n.y),
			title: `${key}`,
			output: `${key}.png`,
		});
	});
}

main().catch(console.error);
