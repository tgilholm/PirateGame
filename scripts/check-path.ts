import * as path from "path";
import fs from 'fs';
import { sortByNearestNeighbour } from "../server/src/utils/nearest-sort"
import { buildPathSpline } from "../server/src/utils/build-path";
import { createPlot } from "../server/src/utils/plot";
import { getTilesetFromLayer } from "../server/src/utils/tile-layer";

const TILEMAP_PATH = path.join(__dirname, "../shared/demo-map.json");
const LAYER_NAME = "npc-ship-path";
const TILE_SIZE = 64;



async function main() {

    // Read from the tilemap
    const mapData = JSON.parse(fs.readFileSync(TILEMAP_PATH, 'utf-8'));


    const raw = getTilesetFromLayer(TILEMAP_PATH, LAYER_NAME);
    console.log(`Found ${raw.length} path nodes`);

    const sorted = sortByNearestNeighbour(raw);
    const spline = buildPathSpline(sorted, 0.5, 25, true);

    await createPlot({ x: sorted.map(n => n.x), y: sorted.map(n => n.y), title: "Before", output: "before.png" });
    await createPlot({ x: spline.map(n => n.x), y: spline.map(n => n.y), title: "After", output: "after.png" });

    console.log("Plots saved: before.png, after.png");
}

main().catch(console.error);