import * as path from "path";
import fs from 'fs';
import { buildPathSpline, sortByNearestNeighbour } from "../server/src/utils/splines";
import { createPlot } from "./plot";
import { getTilesetFromLayer } from "../server/src/utils/tiles";

const TILEMAP_PATH = path.join(__dirname, "../shared/demo-map.json");
const LAYER_NAME = "npc-ship-path";



async function main() {

    // Read from the tilemap
    const mapData = JSON.parse(fs.readFileSync(TILEMAP_PATH, 'utf-8'));

    const raw = getTilesetFromLayer(mapData, LAYER_NAME);
    console.log(`Found ${raw.length} path nodes`);

    const sorted = sortByNearestNeighbour(raw);
    const spline = buildPathSpline(raw, 0.5, 25, true);

    await createPlot({ x: sorted.map(n => n.x), y: sorted.map(n => n.y), title: "Before", output: "before.png" });
    await createPlot({ x: spline.map(n => n.x), y: spline.map(n => n.y), title: "After", output: "after.png" });

    spline.forEach((item) => {
        console.log(item.x, item.y);
    });
    console.log("Plots saved: before.png, after.png");
}

main().catch(console.error);