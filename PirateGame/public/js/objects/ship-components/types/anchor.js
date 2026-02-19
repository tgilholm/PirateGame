import ShipComponent from '../shipComponent.js';

//Anchor component - slowdown speed and emergency stop

export default class Anchor extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'anchor', variant);
        this.deployed = false;
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    stopPower: 10,
                    deployTime: 2.0, 
                    retrieveTime: 3.0, 
                    weight: 30,
                };
                break;
            case 'LVL2':
                this.stats = {
                    stopPower: 20,
                    deployTime: 1.5,
                    retrieveTime: 2.5,
                    weight: 50,
                };
                break;
            case 'LVL3':
                this.stats = {
                    stopPower: 30,
                    deployTime: 1.0,
                    retrieveTime: 2.0,
                    weight: 70,
                };
                break;
                case 'kraken':
                this.stats = {
                    stopPower: 50,
                    deployTime: 0.5,
                    retrieveTime: 1.0,
                    weight: 150,
                };
                break;
            default:
                this.stats = { stopPower: 10, deployTime: 2.0, retrieveTime: 3.0, weight: 30 };
        }

        this.offset = { x: -50, y: 20 };
    }

    create(shipContainer) {
    }

    update() {
        // Update anchor logic
    }

    deploy() {
        if (this.isDeployed()) {
            console.log('already deployed');
            return;
        }
        if (!this.isDeployed() && this.isDeployReady()) {
            //deploy logic
        }
    }

    retrieve() {
        if (!this.isDeployed()) {
            console.log('already retrieved');
            return;
        }
        if (this.isDeployed() && this.isRetrieveReady()) {
            //retrieve logic
        }
    }

    isDeployReady() {
        //cooldown
    }

    isRetrieveReady() {
        //cooldown
    }

    isDeployed() {
        return this.deployed ? true : false;
    }

    /**
     * Add Anchor stats to totalStats
     * Contributes: stopPower, deployTime, retrieveTime, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.stopPower += this.stats.stopPower || 0;
        totalStats.deployTime += this.stats.deployTime || 0;
        totalStats.retrieveTime += this.stats.retrieveTime || 0;
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
        totalStats.turnSpeed += 0;
        totalStats.responseTime += 0;
        totalStats.straighteningSpeed += 0;
        totalStats.fireRate += 0;
        totalStats.accuracy += 0;
    }
}
