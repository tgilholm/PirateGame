import TerrainMap from 'src/engine/terrain-map';
import { BaseSystem } from './base-system';

export default class SpawnSystem implements BaseSystem {
	constructor(private terrain: TerrainMap) {}

	update(dt: number): void {
		//throw new Error('Method not implemented.');
	}

	getSpawnPoint() {
		const spawnPoints = this.terrain.getObjectLayer('player-spawns');

		// let dist = 1000;
		// let spawnPoint = { x: 0, y: 0 };
		// while (dist > 500) {
		//     spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

		//     // Get distance to players & ships
		//     const ships = this.registry.getByType<Ship>('ship');
		//     const players = this.registry.getByType<Player>('player');

		//     // Calculate the minimum distance
		//     const distances: number[] = [];
		//     ships.forEach(ship => distances.push(Math.hypot(ship.x - spawnPoint.x, ship.y - spawnPoint.y)));
		//     players.forEach(player => {
		//         // Get world coordinates
		//         const worldPos = this.getWorldPosition(player);
		//         distances.push(Math.hypot(worldPos.x - spawnPoint.x, worldPos.y - spawnPoint.y));

		//     });

		//     // If all the distances are far enough away, spawn the player

		//     console.log(dist, spawnPoint);

		//     distances.sort();
		//     dist = distances[0];
		// }
		return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
	}
}
