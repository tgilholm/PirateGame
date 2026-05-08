import EntityRegistry from '../engine/entity-registry';
import Matter from 'matter-js';
import { BaseSystem } from './base-system';
import TerrainMap from '../engine/terrain-map';
import Ship from '../entities/ship';

// Thresholds over which the matter body has moved enough to justify sending it
const POS_THRESHOLD = 0.5;
const ROT_THRESHOLD = 0.001;
const VEL_THRESHOLD = 0.05;

/**
 * Contains methods related to the matter physics system. Initialises
 * solid matter objects for island tiles and ships, and updates the internal
 * simulation each tick
 */
export default class PhysicsSystem implements BaseSystem {
	/**
	 *
	 * @param registry the repository of entities
	 * @param engine the provided matter-js engine
	 * @param terrainMap to create solid objects for tiles
	 */
	constructor(
		private registry: EntityRegistry,
		private engine: Matter.Engine,
		terrainMap: TerrainMap
	) {
		this.initTerrain(terrainMap);
	}

	/**
	 * Creates solid objects for each island tile, and builds the bounding box around the world
	 * to contain matter objects- note that objects not using the matter-js system will need to be
	 * handled separately, as they will ignore all matter object
	 * @param terrainMap the terrain map from which to create objects
	 */
	private initTerrain(terrainMap: TerrainMap): void {
		const W = terrainMap.widthInPixels;
		const H = terrainMap.heightInPixels;
		const T = 2000; // wall thickness

		// Create the border
		const walls = [
			Matter.Bodies.rectangle(W / 2, -T / 2, W, T, { isStatic: true, label: 'bound' }), // top
			Matter.Bodies.rectangle(W / 2, H + T / 2, W, T, { isStatic: true, label: 'bound' }), // bottom
			Matter.Bodies.rectangle(-T / 2, H / 2, T, H, { isStatic: true, label: 'bound' }), // left
			Matter.Bodies.rectangle(W + T / 2, H / 2, T, H, { isStatic: true, label: 'bound' }), // right
		];

		Matter.World.add(this.engine.world, walls);

		// Add a rectangle at each solid object
		this.createMatterBodies(terrainMap, 'islands');
		this.createMatterBodies(terrainMap, 'buildings');

		console.log(`[PhysicsSystem] Added island collision bodies`);
	}

	private createMatterBodies(terrainMap: TerrainMap, tilesetName: string) {
		const tileset = terrainMap.getTileset(tilesetName);

		if (!tileset) return;

		tileset.forEach(({ x, y }) => {
			const body = Matter.Bodies.rectangle(x, y, terrainMap.tileWidth, terrainMap.tileWidth, {
				isStatic: true,
				label: tilesetName,
			});
			Matter.World.add(this.engine.world, body);
		});
	}

	/**
	 * Adds a matter-js body to the game
	 * @param body the body to add
	 */
	public addBody(body: Matter.Body): void {
		Matter.World.add(this.engine.world, body);
	}

	/**
	 * Removes a matter-js body from the game
	 * @param body the body to remove
	 */
	public removeBody(body: Matter.Body): void {
		Matter.World.remove(this.engine.world, body);
	}

	/**
	 * Updates the internal physics system of the game
	 * @param dt the difference in time from the last update
	 */
	public update(dt: number): void {
		Matter.Engine.update(this.engine, dt * 1000);

		// Sync matter body state back to ship entities, marking dirty if changed
		this.registry.getByType('ship').forEach((ship) => {
			if (!(ship instanceof Ship)) return;

			const newX = ship.body.position.x;
			const newY = ship.body.position.y;
			const newR = ship.body.angle;
			const newVx = ship.body.velocity.x;
			const newVy = ship.body.velocity.y;
			const newAv = ship.body.angularVelocity;

			// Returns true if any of the parameters have changed above the thresholds
			// Completely static ships will not be sent
			const moved =
				Math.abs(newX - ship.x) > POS_THRESHOLD ||
				Math.abs(newY - ship.y) > POS_THRESHOLD ||
				Math.abs(newR - ship.r) > ROT_THRESHOLD ||
				Math.abs(newVx - ship.vx) > VEL_THRESHOLD ||
				Math.abs(newVy - ship.vy) > VEL_THRESHOLD ||
				Math.abs(newAv - ship.av) > VEL_THRESHOLD;

			ship.x = newX;
			ship.y = newY;
			ship.r = newR;
			ship.vx = newVx;
			ship.vy = newVy;
			ship.av = newAv;

			// Ensure that this ship will be sent to the client
			if (moved) ship.markDirty();
		});
	}
}
