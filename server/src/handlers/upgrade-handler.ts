import Ship from '../entities/ship';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const typesData = require('../../entities/types.json');

const LEVEL_PROGRESSION = ['LVL1', 'LVL2', 'LVL3'];

export default class UpgradeHandler {
    constructor(private readonly upgradeConfig: any) {}

    /**
     * Advances a ship's component one step up the level progression (LVL1→LVL2→LVL3).
     * Returns true if the upgrade was applied, false if the component is already at max
     * or the key is unrecognised.
     */
    handleUpgrade(ship: Ship, componentKey: string): boolean {
        const components = typesData.components as Record<string, { variants: Record<string, unknown> }>;

        if (!components[componentKey]) return false;

        const current = ship.components[componentKey] ?? 'LVL1';
        const currentIndex = LEVEL_PROGRESSION.indexOf(current);

        // Already at max or unrecognised variant
        if (currentIndex < 0 || currentIndex >= LEVEL_PROGRESSION.length - 1) return false;

        const nextLevel = LEVEL_PROGRESSION[currentIndex + 1];
        if (!components[componentKey].variants[nextLevel]) return false;

        ship.components[componentKey] = nextLevel;
        console.log(`[UpgradeHandler] ${ship.id} ${componentKey}: ${current} → ${nextLevel}`);
        return true;
    }
}