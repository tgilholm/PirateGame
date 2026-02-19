import ShipComponent from '../shipComponent.js';

//Rudder component - turn speed and responsiveness

export default class Rudder extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'rudder', variant);
        this.angle = 0; // Current rudder angle
        this.maxAngle = Math.PI / 4; // Max turn angle
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    turnSpeed: 1.0,
                    responseTime: 1.0,
                    straighteningSpeed: 1,
                    weight: 50,
                };
                break;
            case 'LVL2':
                this.stats = {
                    turnSpeed: 1.2,
                    responseTime: 0.8,
                    straighteningSpeed: 0.5,
                    weight: 60,
                };
                break;
            case 'LVL3':
                this.stats = {
                    turnSpeed: 1.5,
                    responseTime: 0.6,
                    straighteningSpeed: 0.25,
                    weight: 80,
                };
                break;
                case 'kraken':
                this.stats = {
                    turnSpeed: 1.2,
                    responseTime: 0.8,
                    straighteningSpeed: 0.5,
                    weight: 250,
                };
                break;
            default:
                this.stats = { turnSpeed: 1.0, responseTime: 1.0, straighteningSpeed: 1.0, weight: 50 };
        }

        //Set default position
        this.offset = { x: -80, y: 0 };
    }

    create(shipContainer) {
        //creates rudder
    }

    update() {
        //Update rudder logic
    }

    
    straightenRudder() {
        //Gradually straightens rudder over time if no direction input, better rudder the quicker
    }

    /**
     * Add Rudder stats to totalStats
     * Contributes: turnSpeed, responseTime, straighteningSpeed, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.turnSpeed += this.stats.turnSpeed || 0;
        totalStats.responseTime += this.stats.responseTime || 0;
        totalStats.straighteningSpeed += this.stats.straighteningSpeed || 0;
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
        totalStats.fireRate += 0;
        totalStats.accuracy += 0;
    }
}
