import ShipComponent from '../shipComponent.js';

//Body/hull component - max HP, limits the amount of crew on board

export default class Body extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'body', variant);
        this.dimensions = {};
        this.initialize();
    }
    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    maxHealth: 200,
                    crewCapacity: 10,
                    weight: 50
                };
                break;
            case 'LVL2':
                this.stats = {
                    maxHealth: 400,
                    crewCapacity: 20,
                    weight: 100
                };
                break;
            case 'LVL3':
                this.stats = {
                    maxHealth: 500,
                    crewCapacity: 25,
                    weight: 125
                };
                break;
                case 'kraken':
                this.stats = {
                    maxHealth: 1000,
                    crewCapacity: 50,
                    weight: 250
                };

                break;
            default:
                this.stats = { maxHealth: 400, crewCapacity: 20, weight: 100 };
                this.dimensions = { height: 160, width: 200 };
        }

        this.offset = { x: 0, y: 0 }; // Hull is centered
    }

    create(shipContainer) {

    }

    update() {
        //Update hull logic
    }

    /**
     * Add Body stats to totalStats
     * Contributes: maxHealth, crewCapacity, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.maxHealth += this.stats.maxHealth || 0;
        totalStats.crewCapacity += this.stats.crewCapacity || 0;
        totalStats.weight += this.stats.weight || 0;
        
        // Stats this component doesn't affect (explicitly adding 0 for clarity)
        totalStats.acceleration += 0;
        totalStats.maxSpeed += 0;
        totalStats.damage += 0;
        totalStats.range += 0;
        totalStats.cannonCount += 0;
        totalStats.rammingPower += 0;
        totalStats.minimapRange += 0;
        totalStats.visionRange += 0;
        totalStats.crewSlots += 0;
        totalStats.stopPower += 0;
        totalStats.deployTime += 0;
        totalStats.retrieveTime += 0;
        totalStats.turnSpeed += 0;
        totalStats.responseTime += 0;
        totalStats.straighteningSpeed += 0;
        totalStats.fireRate += 0;
        totalStats.accuracy += 0;
    }
}
