import EntityRegistry from 'src/engine/entity-registry';
import Player from 'src/entities/player';
import Ship from 'src/entities/ship';
import { UpgradeConfig } from 'src/types';

export default class UpgradeHandler {
	constructor(
		private readonly upgradeConfig: UpgradeConfig,
		private readonly registry: EntityRegistry
	) {}

	handleUpgrade(ship: Ship, upgradeName: string, player: Player) {
		if (!this.isValidUpgrade(upgradeName)) return;
		const currentLevel = ship.upgrades[upgradeName];

		// check if at max
		if (currentLevel >= this.upgradeConfig[upgradeName].costs.length) return;

		const cost = this.upgradeConfig[upgradeName].costs[currentLevel];
		if (cost <= player.gold) {
			ship.upgrades[upgradeName] += 1;

			player.gold -= cost;
		}

		ship.markDirty();
		player.markDirty();
	}

	private isValidUpgrade(name: string): name is keyof UpgradeConfig {
		return name in this.upgradeConfig;
	}
}
