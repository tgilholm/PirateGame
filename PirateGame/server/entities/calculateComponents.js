const types = require('./entities/types.json');
const shipPresets = require('./shipPresets.json');


//initialise default ship, can be changed to preference
let inputBody = 'LVL1';
let inputSails = 'LVL1';
let inputCannons = 'LVL1';
let inputHead = 'LVL1';
let inputCrowsnest = 'LVL1';
let inputAnchor = 'LVL1';
let inputRudder = 'LVL1';
let inputCrew = 'LVL1';

//create custom ship
const shipComponents = {
    inputBody,
    inputSails,
    inputCannons,
    inputHead,
    inputCrowsnest,
    inputAnchor,
    inputRudder,
    inputCrew
};
 // calculate stats for custom ship for each component
function updateShipComponent(componentType, variant) {
    const componentKey = `input${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;
    if (componentKey.toLowerCase().includes('crowsnest')) {
        inputCrowsnest = variant;
    } else if (componentKey.toLowerCase().includes('cannons')) {
        inputCannons = variant;
    } else if (componentKey === 'inputBody') {
        inputBody = variant;
    } else if (componentKey === 'inputSails') {
        inputSails = variant;
    } else if (componentKey === 'inputHead') {
        inputHead = variant;
    } else if (componentKey === 'inputAnchor') {
        inputAnchor = variant;
    } else if (componentKey === 'inputRudder') {
        inputRudder = variant;
    } else if (componentKey === 'inputCrew') {
        inputCrew = variant;
    }
    
    const totalStats = calculateShipStats();
    logStats(totalStats);
}

// sets ship stats to 0 and re-calculates all
function calculateShipStats() {

    let totalStats = {
        //body
        maxHealth: 0 + types.components.body.variants[inputBody].stats.maxHealth,
        crewCapacity: 0 + types.components.body.variants[inputBody].stats.crewCapacity,
        
        //sails
        acceleration: 0 + types.components.sails.variants[inputSails].stats.acceleration,
        maxSpeed: 0 + types.components.sails.variants[inputSails].stats.maxSpeed,
        
        //cannons
        damage: 0 + types.components.cannons.variants[inputCannons].stats.damage,
        range: 0 + types.components.cannons.variants[inputCannons].stats.range,
        cannonCount: 0 + types.components.cannons.variants[inputCannons].stats.cannonCount,
        
        //head
        rammingPower: 0 + types.components.head.variants[inputHead].stats.rammingPower,
        
        //crows nest
        minimapRange: 0 + types.components.crowsnest.variants[inputCrowsnest].stats.minimapRange,
        visionRange: 0 + types.components.crowsnest.variants[inputCrowsnest].stats.visionRange,
        crewSlots: 0 + types.components.crowsnest.variants[inputCrowsnest].stats.crewSlots,
        
        //anchor
        stopPower: 0 + types.components.anchor.variants[inputAnchor].stats.stopPower,
        deployTime: 0 + types.components.anchor.variants[inputAnchor].stats.deployTime,
        retrieveTime: 0 + types.components.anchor.variants[inputAnchor].stats.retrieveTime,
        
        //rudder
        turnSpeed: 0 + types.components.rudder.variants[inputRudder].stats.turnSpeed,
        responseTime: 0 + types.components.rudder.variants[inputRudder].stats.responseTime,
        straighteningSpeed: 0 + types.components.rudder.variants[inputRudder].stats.straighteningSpeed,
        
        //crew
        fireRate: 0 + types.components.crew.variants[inputCrew].stats.fireRate,
        accuracy: 0 + types.components.crew.variants[inputCrew].stats.accuracy,
        
        //universal
        weight: 0 + types.components.body.variants[inputBody].stats.weight + types.components.sails.variants[inputSails].stats.weight + types.components.cannons.variants[inputCannons].stats.weight + types.components.head.variants[inputHead].stats.weight + types.components.crowsnest.variants[inputCrowsnest].stats.weight + types.components.anchor.variants[inputAnchor].stats.weight + types.components.rudder.variants[inputRudder].stats.weight + types.components.crew.variants[inputCrew].stats.weight
    };

    return totalStats;
}
//debug (ctr+shift+I in browser, in console tab)
function logStats(stats) {
    // Body Stats
    console.log('Max Health:', stats.maxHealth);
    console.log('Crew Capacity:', stats.crewCapacity);

    // Sails Stats
    console.log('Acceleration:', stats.acceleration);
    console.log('Max Speed:', stats.maxSpeed);

    // Cannons Stats
    console.log('Damage:', stats.damage);
    console.log('Range:', stats.range);
    console.log('Cannon Count:', stats.cannonCount);

    // Head Stats
    console.log('Ramming Power:', stats.rammingPower);

    // Crow's Nest Stats
    console.log('Minimap Range:', stats.minimapRange);
    console.log('Vision Range:', stats.visionRange);
    console.log('Crew Slots:', stats.crewSlots);

    // Anchor Stats
    console.log('Stop Power:', stats.stopPower);
    console.log('Deploy Time:', stats.deployTime);
    console.log('Retrieve Time:', stats.retrieveTime);

    // Rudder Stats
    console.log('Turn Speed:', stats.turnSpeed);
    console.log('Response Time:', stats.responseTime);
    console.log('Straightening Speed:', stats.straighteningSpeed);

    // Crew Stats
    console.log('Fire Rate:', stats.fireRate);
    console.log('Accuracy:', stats.accuracy);

    // Universal Stats
    console.log('Weight:', stats.weight);
}

// Example use
const totalStats = calculateShipStats();
logStats(totalStats);

// Update a component and recalculate
updateShipComponent('sails', 'LVL2');

//allows use of functions in other places
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateShipStats,
        logStats,
        updateShipComponent,
        shipComponents
    };
}



