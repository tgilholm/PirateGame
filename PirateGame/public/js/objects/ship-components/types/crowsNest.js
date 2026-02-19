import ShipComponent from '../shipComponent.js';

//CrowsNest component - minimap vision, visual vision, and crew slots

export default class CrowsNest extends ShipComponent {
    constructor(scene, variant = 'LVL1') {
        super(scene, 'crowsnest', variant);
        this.initialize();
    }

    initialize() {
        switch (this.variant) {
            case 'LVL1':
                this.stats = {
                    minimapRange: 100,
                    visionRange: 100,
                    crewSlots: 0,
                    weight: 20,
                };
                break;
            case 'LVL2':
                this.stats = {
                    minimapRange: 150,
                    visionRange: 150,
                    crewSlots: 1,
                    weight: 40,
                };
                break;
            case 'LVL3':
                this.stats = {
                    minimapRange: 200,
                    visionRange: 200,
                    crewSlots: 2,
                    weight: 60,
                };
                break;
                case 'kraken':
                this.stats = {
                    minimapRange: 300,
                    visionRange: 300,
                    crewSlots: 4,
                    weight: 250,
                };
                break;
            default:
                this.stats = { minimapRange: 100, visionRange: 100, crewSlots: 0, weight: 20 };
        }

        //Set default position
        this.offset = { x: 0, y: -60 };
    }

    create(shipContainer) {
    
    }

    update() {
        //Update crow nest logic
    }

    assignCrew(crewMember) {
     //Assign crew member to crows nest
    }

    
    removeCrew() {
        //Remove crew member from crows nest
    }

    /**
     * Add CrowsNest stats to totalStats
     * Contributes: minimapRange, visionRange, crewSlots, weight
     * Doesn't affect: all other stats (adds 0)
     */
    addToTotalStats(totalStats) {
        // Stats this component affects
        totalStats.minimapRange += this.stats.minimapRange || 0;
        totalStats.visionRange += this.stats.visionRange || 0;
        totalStats.crewSlots += this.stats.crewSlots || 0;
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
