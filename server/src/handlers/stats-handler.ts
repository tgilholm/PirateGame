// import Ship from '../entities/ship';
// import componentsData from '../../jsons/components.json';
// import entityConfig from '../../../shared/entity-config.json';

// // all ship stats
// export type ShipStats = {
// 	maxHealth: number; //implemented

// 	acceleration: number; //not yet implemented

// 	maxSpeed: number; //not yet implemented

// 	cannonDamage: number; //implemented

// 	cannonRange: number; //implemented

// 	cannonBallSpeed: number; //implemented

// 	rammingPower: number; //feature yet to be added

// 	minimapRange: number; //feature yet to be added

// 	visionRange: number; //feature yet to be added

// 	turnSpeed: number; //not yet implemented

// 	responseTime: number; //feature yet to be added

// 	reloadTime: number; // (in ms), implemented

// 	accuracy: number; //feature yet to be added

// 	weight: number; //not yet implemented

// 	frictionAir: number; //not yet implemented
// };

// type ComponentsMap = Record<
// 	string,
// 	{
// 		variants: Record<string, { cost: number; stats: Record<string, number> }>;
// 	}
// >;

// export default class StatsHandler {
// 	/**
// 	 * calculates a ships stats based on the default + bonus stats from components
// 	 * @param ship the target ship
// 	 * @returns a ShipStats object with all bonuses applied
// 	 */
// 	calculateStats(ship: Ship): ShipStats {
// 		//copies the config defaults
// 		const stats: ShipStats = { ...entityConfig.ship.defaultStats };

// 		const components = componentsData.components as ComponentsMap;

// 		for (const [componentKey, variantKey] of Object.entries(ship.components)) {
// 			const component = components[componentKey];
// 			if (!component) continue;

// 			const variant = component.variants[variantKey];
// 			if (!variant) continue;

// 			// Add every stat bonus this variant provides
// 			for (const [statKey, bonus] of Object.entries(variant.stats)) {
// 				if (statKey in stats) {
// 					(stats as Record<string, number>)[statKey] += bonus;
// 				}
// 			}
// 		}

// 		return stats;
// 	}
// }
