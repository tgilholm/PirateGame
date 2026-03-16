import Ship from '../entities/ship';
import Player from '../entities/player';
import GoldHandler from './gold-handler';
import StatsHandler from './stats-handler';
import Cannon from '../entities/interactables/cannon';
import componentsData from '../../jsons/components.json';

const level_progression = ['LVL1', 'LVL2', 'LVL3'];

export default class UpgradeHandler {
    constructor(
        private readonly goldHandler: GoldHandler,
        private readonly statsHandler: StatsHandler,
    ) {}

    /**
     * levels up ship component
     * checks if component is already max lvl or if player has enough gold
     */
    handleUpgrade(ship: Ship, componentKey: string, player: Player): boolean {
        console.log("[UpgradeHandler] Attempting upgrade: player=" + player.id + " ship=" + ship.id + " component=" + componentKey);
        const components = componentsData.components as Record<string, { variants: Record<string, { cost: number }> }>;

        if (!components[componentKey]) return false;

        const current = ship.components[componentKey];
        const currentIndex = level_progression.indexOf(current);

        //already at max or unknown
        if (currentIndex < 0 || currentIndex >= level_progression.length - 1) return false;

        const nextLevel = level_progression[currentIndex + 1];
        const nextVariant = components[componentKey].variants[nextLevel];
        if (!nextVariant) return false;

        //gold check (costs defined in components.json)
        const cost = nextVariant.cost;
        if (!this.goldHandler.trySpendGold(player, cost)) {
            console.log("[UpgradeHandler] cannot afford " + componentKey + " : " + nextLevel + " (cost: " + cost + ", gold: " + player.gold + ")");
            return false;
        }
        ship.components[componentKey] = nextLevel;
        ship.markDirty(); // force components into the next delta packet

        // Re-calculate and apply stats affected by the upgrade
        const stats = this.statsHandler.calculateStats(ship);
        for (const interactable of ship.interactables) {
            if (interactable instanceof Cannon) {
                interactable.reloadTime = stats.reloadTime;
                interactable.cannonDamage = stats.cannonDamage;
                interactable.cannonRange = stats.cannonRange;
            }
        }

        console.log("[UpgradeHandler] " + ship.id + " " + componentKey + ": " + current + " : " + nextLevel);
        return true;
    }
}
