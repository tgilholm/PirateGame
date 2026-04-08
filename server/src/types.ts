import entityConfig from '../../shared/entity-config.json';
import upgradeConfig from '../../shared/upgrade-config.json';
import map from '../../shared/demo-map.json';

// Provides type hinting to TS files using the entity config
// This makes it easier to use the entity config without needing to import it directly into the file being used

export type EntityConfig = typeof entityConfig;
export type PlayerConfig = (typeof entityConfig)['player'];
export type ShipConfig = (typeof entityConfig)['ship'];
export type UpgradeConfig = typeof upgradeConfig;
export type NPCShipConfig = (typeof entityConfig)['npcShip'];

export type WorldMap = typeof map;

export interface InteractableInstance {
	type: string;
	x: number;
	y: number;
}
