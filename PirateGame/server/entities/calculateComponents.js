import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const types = require('./types.json');
const shipPresets = require('./shipPresets.json');

//initialise default ship, can be changed to preference
let inputBody = 'LVL1';
let inputSails = 'LVL1';
let inputCannons = 'LVL1';
let inputHead = 'LVL1';
let inputCrowsnest = 'LVL2';
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

    let totalStats = {//WIP, comments are what the final functions will be, some are calculated differently for testing
        //body
        maxHealth: 250 + types.components.body.variants[inputBody].stats.maxHealth, //base max health of ship
        crewCapacity: 2 + types.components.body.variants[inputBody].stats.crewCapacity, //base number of max crew on ship
        
        //sails
        acceleration: 0.05 + types.components.sails.variants[inputSails].stats.acceleration,//base acceleration of ship, in grids/s^2
        maxSpeed: 1 + types.components.sails.variants[inputSails].stats.maxSpeed, //base max speed of ship, in grids/s
        
        //cannons
        damage: 100 + types.components.cannons.variants[inputCannons].stats.damage,//base damage of cannons
        range: 8 + types.components.cannons.variants[inputCannons].stats.range, //distance cannonballs can travel before disappearing, in grids
        cannonCount: 1 + types.components.cannons.variants[inputCannons].stats.cannonCount, //number of cannons per side, so total cannons is double
        
        //head
        rammingPower: 100 + types.components.head.variants[inputHead].stats.rammingPower,//how much damage the ship does to other ships and itself when ramming
        
        //crows nest
        minimapRange: 100 + types.components.crowsNest.variants[inputCrowsnest].stats.minimapRange, //how far teh minimap can see, in grids, (does not affect full map vision)
        visionRange: 1 + types.components.crowsNest.variants[inputCrowsnest].stats.visionRange, //how many zoom toggles the ship has (1-5)
        
        //anchor
        stopPower: 5 + types.components.anchor.variants[inputAnchor].stats.stopPower, //how quickly ship can stop when anchor is deployed from max speed (seconds)
        deployTime: 3 + types.components.anchor.variants[inputAnchor].stats.deployTime, //time it takes to deploy anchor (seconds)
        retrieveTime: 3 + types.components.anchor.variants[inputAnchor].stats.retrieveTime, //time it takes to retrieve anchor after deployment (seconds)
        
        //rudder
        turnSpeed: 50 + types.components.rudder.variants[inputRudder].stats.turnSpeed,//degrees per second at max rudder angle
        responseTime: 3 + types.components.rudder.variants[inputRudder].stats.responseTime, //time for wheel to turn full port/starboard
        
        //crew
        fireRate: 3 + types.components.crew.variants[inputCrew].stats.fireRate, //length of time before cannon can be fired again (seconds)
        accuracy: 10 + types.components.crew.variants[inputCrew].stats.accuracy, //size of shooting cone for cannons, in degrees
        
        //universal
        weight: 100 + types.components.body.variants[inputBody].stats.weight +
        types.components.sails.variants[inputSails].stats.weight +
        types.components.cannons.variants[inputCannons].stats.weight +
        types.components.head.variants[inputHead].stats.weight +
        types.components.crowsNest.variants[inputCrowsnest].stats.weight +
        types.components.anchor.variants[inputAnchor].stats.weight +
        types.components.rudder.variants[inputRudder].stats.weight +
        types.components.crew.variants[inputCrew].stats.weight
    };//base weight of ship

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

    // Anchor Stats
    console.log('Stop Power:', stats.stopPower);
    console.log('Deploy Time:', stats.deployTime);
    console.log('Retrieve Time:', stats.retrieveTime);

    // Rudder Stats
    console.log('Turn Speed:', stats.turnSpeed);
    console.log('Response Time:', stats.responseTime);

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
export {
    calculateShipStats,
    logStats,
    updateShipComponent,
    shipComponents
};



