import ShipComponent from '../shipComponent.js';

//crew component - affects fire_rate and accuracy of cannons
export default class Crew extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'crew', variant);
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    fireRate: 1.0,
                    accuracy: 1.0,
                    weight: 50,
                    }
                break;
            case 'LVL2':
                this.stats = {
                    fireRate: 1.2,
                    accuracy: 1.1,
                    weight: 75,
                    }
                break;
            case 'LVL3':
                this.stats = {
                    fireRate: 1.5,
                    accuracy: 1.2,
                    weight: 100,
                    }
                break;
                case 'kraken':
                this.stats = {
                    fireRate: 2.0,
                    accuracy: 1.5,
                    weight: 250,
                    }
                break;
            default:
                this.stats = { fireRate: 1.0, accuracy: 1.0, weight: 50 };
        }
           
    }
    update() {
        //update crew specific logic
    }

    /**
     * Add Crew stats to totalStats
     * Contributes: fireRate, accuracy, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.fireRate += this.stats.fireRate || 0;
        totalStats.accuracy += this.stats.accuracy || 0;
        totalStats.weight += this.stats.weight || 0;
        
        // Stats this component doesn't affect (explicitly adding 0 for clarity)
        totalStats.maxHealth += 0;
        totalStats.crewCapacity += 0;
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
    }
}
                   
