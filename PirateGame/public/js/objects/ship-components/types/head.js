import ShipComponent from '../shipComponent.js';

//Head component - ramming power

export default class Head extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'head', variant);
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    rammingPower: 0,
                    weight: 50,
                    //something else?
  
                };
                break;
            case 'LVL2':
                this.stats = {
                    rammingPower: 5,
                    weight: 75,
                };
                break;
            case 'LVL3':
                this.stats = {
                    rammingPower: 10,
                    weight: 100,
                };
                break;
                case 'kraken':
                this.stats = {
                    rammingPower: 20,
                    weight: 250,
                };
                break;
            
            default:
                this.stats = {rammingPower: 0, weight: 50};
        }

        //Set position
        this.offset = { x: 80, y: 0 };
    }

    create(shipContainer) {
        //adds head to ship

    }

    update() {
        //update head specific logic
    }

    checkRammingSpeed() {
        //check if ramming speed is on cooldown or not
    }

    rammingSpeed() {
        //boost forward for a short while, dealing extra ram damage
    }

    /**
     * Add Head stats to totalStats
     * Contributes: rammingPower, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.rammingPower += this.stats.rammingPower || 0;
        totalStats.weight += this.stats.weight || 0;
        
        // Stats this component doesn't affect (explicitly adding 0 for clarity)
        totalStats.maxHealth += 0;
        totalStats.crewCapacity += 0;
        totalStats.acceleration += 0;
        totalStats.maxSpeed += 0;
        totalStats.damage += 0;
        totalStats.range += 0;
        totalStats.cannonCount += 0;
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
