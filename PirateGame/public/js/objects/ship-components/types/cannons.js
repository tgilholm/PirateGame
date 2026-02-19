import ShipComponent from '../shipComponent.js';

//Cannons component - affects cannons damage, range and amount

export default class Cannons extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'cannons', variant);
        this.cannonCount = 0;
        this.cannonPositions = [];
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    damage: 10,
                    range: 150,
                    cannonCount: 4,
                    weight: 50,
                };
                break;
            case 'LVL2':
                this.stats = {
                    damage: 20,
                    range: 200,
                    cannonCount: 6,
                    weight: 75,
                };
                break;
            case 'LVL3':
                this.stats = {
                    damage: 40,
                    range: 250,
                    cannonCount: 8,
                    weight: 100,

                };
                break;
                case 'kraken':
                this.stats = {
                    damage: 60,
                    range: 300,
                    cannonCount: 12,
                    weight: 250,
                };
                break;
            default:
                this.stats = { damage: 10, range: 150, cannonCount: 4 };
        }

        this.cannonCount = this.stats.cannonCount;
        //Calculate cannon positions on ship 
    }

    create(shipContainer) {
        //create cannons
    }

    update() {
    //Updates new component logic
    }

   
    fire(cannonNum) {
        //Check if each cannonNum is ready to fire
        //Calculate firing angles
        //calls cannonBall object for creation
        //fire available cannons
        //Play firing animation and sound
        //Start reload timer
        //maybe add specific cannon fireing? key-1 = fire cannon 1, key-2 = 2, etc, but for now fire all available
    }


    getCannonPositions() {
        return this.cannonPositions;
    }

    isReady(cannonNum) {
        //Check if reloaded 
        //if reloded
           //Return true
        //else
           //return false
    }

    /**
     * Add Cannons stats to totalStats
     * Contributes: damage, range, cannonCount, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.damage += this.stats.damage || 0;
        totalStats.range += this.stats.range || 0;
        totalStats.cannonCount += this.stats.cannonCount || 0;
        totalStats.weight += this.stats.weight || 0;
        
        // Stats this component doesn't affect 
        totalStats.maxHealth += 0;
        totalStats.crewCapacity += 0;
        totalStats.acceleration += 0;
        totalStats.maxSpeed += 0;
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
