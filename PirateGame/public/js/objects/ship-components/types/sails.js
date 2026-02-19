import ShipComponent from '../shipComponent.js';

//sails component - acceleration and max speed
//temp variants: LVL1, LVL2, LVL3
export default class Sails extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'sails', variant);
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    acceleration: 1.0,
                    maxSpeed: 1.0,
                    weight: 50,
                    //durability?
                    //e.t.c.?
                };
                break;
            case 'LVL2':
                this.stats = {
                    acceleration: 1.3,
                    maxSpeed: 1.1,
                    weight: 75,
                };
                break;
            case 'LVL3':
                this.stats = {
                    acceleration: 1.6,
                    maxSpeed: 1.2,
                    weight: 100,
                };
                break;
            case 'kraken':
                this.stats = {
                    acceleration: 1.0,
                    maxSpeed: 0.8,
                    weight: 250,
                };
                break;
            default:
                this.stats = { acceleration: 1.0, maxSpeed: 1.0, weight: 50 };
        }

        //position relative to base of ship
        this.offset = { x: -30, y: 0 };
    }

    create(shipContainer) {
        //create sails
    }

    /**
     * Add Sails stats to totalStats
     * Contributes: acceleration, maxSpeed, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.acceleration += this.stats.acceleration || 0;
        totalStats.maxSpeed += this.stats.maxSpeed || 0;
        totalStats.weight += this.stats.weight || 0;
        
        // Stats this component doesn't affect (explicitly adding 0 for clarity)
        totalStats.maxHealth += 0;
        totalStats.crewCapacity += 0;
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
