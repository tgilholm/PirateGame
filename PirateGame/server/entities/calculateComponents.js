import { createRequire } from "module";
import * as config from "../config.js";
import { CONFIG } from "../config.js";
const require = createRequire(import.meta.url);
const types = require("./types.json");
const shipPresets = require("./shipPresets.json");

//initialise default ship, can be changed to preference
let inputBody = "LVL1";
let inputSails = "LVL1";
let inputCannons = "LVL1";
let inputHead = "LVL1";
let inputCrowsnest = "LVL2";
let inputAnchor = "LVL1";
let inputRudder = "LVL1";
let inputCrew = "LVL1";

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
    if (componentKey.toLowerCase().includes("crowsnest")) {
        inputCrowsnest = variant;
    } else if (componentKey.toLowerCase().includes("cannons")) {
        inputCannons = variant;
    } else if (componentKey === "inputBody") {
        inputBody = variant;
    } else if (componentKey === "inputSails") {
        inputSails = variant;
    } else if (componentKey === "inputHead") {
        inputHead = variant;
    } else if (componentKey === "inputAnchor") {
        inputAnchor = variant;
    } else if (componentKey === "inputRudder") {
        inputRudder = variant;
    } else if (componentKey === "inputCrew") {
        inputCrew = variant;
    }
    
    const totalStats = calculateShipStats();
    logStats(totalStats);
}

// sets ship stats to 0 and re-calculates all
function calculateShipStats() {

    let totalStats = {//WIP, comments are what the final functions will be, some are calculated differently for testing
        //body
        maxHealth: CONFIG.SHIP.MAX_HEALTH + types.components.body.variants[inputBody].stats.maxHealth, //base max health of ship
        crewCapacity: CONFIG.SHIP.CREW_CAPACITY + types.components.body.variants[inputBody].stats.crewCapacity, //base number of max crew on ship
        
        //sails
        acceleration: CONFIG.SHIP.ACCELERATION + types.components.sails.variants[inputSails].stats.acceleration,//base acceleration of ship, in grids/s^2
        maxSpeed: CONFIG.SHIP.MAX_SPEED + types.components.sails.variants[inputSails].stats.maxSpeed, //base max speed of ship, in grids/s
        
        //cannons
        cannonDamage: CONFIG.SHIP.CANNON_DAMAGE + types.components.cannons.variants[inputCannons].stats.cannonDamage,//base cannonDamage of cannons
        cannonRange: CONFIG.SHIP.CANNON_RANGE + types.components.cannons.variants[inputCannons].stats.cannonRange, //distance cannonballs can travel before disappearing, in grids
        cannonCount: CONFIG.SHIP.CANNON_COUNT + types.components.cannons.variants[inputCannons].stats.cannonCount, //number of cannons per side, so total cannons is double
        
        //head
        rammingPower: CONFIG.SHIP.RAMMING_POWER + types.components.head.variants[inputHead].stats.rammingPower,//how much cannonDamage the ship does to other ships and itself when ramming
        
        //crows nest
        minimapRange: CONFIG.SHIP.MINIMAP_RANGE + types.components.crowsNest.variants[inputCrowsnest].stats.minimapRange, //how far teh minimap can see, in grids, (does not affect full map vision)
        visionRange: CONFIG.SHIP.VISION_RANGE + types.components.crowsNest.variants[inputCrowsnest].stats.visionRange, //how many zoom toggles the ship has (1-5)
        
        //anchor
        stopPower: CONFIG.SHIP.STOP_POWER + types.components.anchor.variants[inputAnchor].stats.stopPower, //how quickly ship can stop when anchor is deployed from max speed (seconds)
        deployTime: CONFIG.SHIP.DEPLOY_TIME + types.components.anchor.variants[inputAnchor].stats.deployTime, //time it takes to deploy anchor (seconds)
        retrieveTime: CONFIG.SHIP.RETRIEVE_TIME + types.components.anchor.variants[inputAnchor].stats.retrieveTime, //time it takes to retrieve anchor after deployment (seconds)
        
        //rudder
        turnSpeed: CONFIG.SHIP.TURN_SPEED + types.components.rudder.variants[inputRudder].stats.turnSpeed,//degrees per second at max rudder angle
        responseTime: CONFIG.SHIP.RESPONSE_TIME + types.components.rudder.variants[inputRudder].stats.responseTime, //time for wheel to turn full port/starboard
        
        //crew
        fireRate: CONFIG.SHIP.FIRE_RATE + types.components.crew.variants[inputCrew].stats.fireRate, //length of time before cannon can be fired again (seconds)
        accuracy: CONFIG.SHIP.ACCURACY + types.components.crew.variants[inputCrew].stats.accuracy, //size of shooting cone for cannons, in degrees
        
        //universal
        weight: CONFIG.SHIP.WEIGHT + types.components.body.variants[inputBody].stats.weight +
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
    console.log("Max Health:", stats.maxHealth);
    console.log("Crew Capacity:", stats.crewCapacity);

    // Sails Stats
    console.log("Acceleration:", stats.acceleration);
    console.log("Max Speed:", stats.maxSpeed);

    // Cannons Stats
    console.log("Cannon cannonDamage:", stats.cannonDamage);
    console.log("Cannon cannonRange:", stats.cannonRange);
    console.log("Cannon Count:", stats.cannonCount);

    // Head Stats
    console.log("Ramming Power:", stats.rammingPower);

    // Crow"s Nest Stats
    console.log("Minimap cannonRange:", stats.minimapRange);
    console.log("Vision cannonRange:", stats.visionRange);

    // Anchor Stats
    console.log("Stop Power:", stats.stopPower);
    console.log("Deploy Time:", stats.deployTime);
    console.log("Retrieve Time:", stats.retrieveTime);

    // Rudder Stats
    console.log("Turn Speed:", stats.turnSpeed);
    console.log("Response Time:", stats.responseTime);

    // Crew Stats
    console.log("Fire Rate:", stats.fireRate);
    console.log("Accuracy:", stats.accuracy);

    // Universal Stats
    console.log("Weight:", stats.weight);
}

export {
    calculateShipStats,
    logStats,
    updateShipComponent,
    shipComponents
};

let configInitialized = false;

export async function initConfig() {
    if (configInitialized) return;
    
    const stats = await calculateShipStats();
    CONFIG.SHIP.MAX_HEALTH = stats.maxHealth;
    CONFIG.SHIP.TURN_SPEED = stats.turnSpeed / 10000;
    CONFIG.SHIP.THRUST = stats.acceleration;
    CONFIG.SHIP.MASS = stats.weight;
    CONFIG.SHIP.MAX_SPEED = stats.maxSpeed;
    CONFIG.SHIP.CANNON_RANGE = stats.cannonRange;
    CONFIG.SHIP.CANNON_COUNT = stats.cannonCount;
    CONFIG.SHIP.CANNON_DAMAGE = stats.cannonDamage;
    CONFIG.SHIP.RAMMING_POWER = stats.rammingPower;
    CONFIG.SHIP.MINIMAP_RANGE = stats.minimapRange;
    CONFIG.SHIP.VISION_RANGE = stats.visionRange;
    configInitialized = true;
}

