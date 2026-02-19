import { calculateShipStats } from './ShipPresets.js';
import { Body, Sails, Cannons, Head, CrowsNest, Anchor, Rudder, Crew } from './index.js';

//create custom ship
const components = {
    body: new Body('LVL1'),
    sails: new Sails('LVL1'),
    cannons: new Cannons('LVL1'),
    head: new Head('LVL1'),
    crowsnest: new CrowsNest('LVL1'),
    anchor: new Anchor('LVL1'),
    rudder: new Rudder('LVL1'),
    crew: new Crew('LVL1')
};

calculateShipStats(components);{
    let totalStats = {
        //body
        maxHealth: 0,
        crewCapacity: 0,
        
        //sails
        acceleration: 0,
        maxSpeed: 0,
        
        //cannons
        damage: 0,
        range: 0,
        cannonCount: 0,
        
        //head
        rammingPower: 0,
        
        //crows nest
        minimapRange: 0,
        visionRange: 0,
        crewSlots: 0,
        
        //anchor
        stopPower: 0,
        deployTime: 0,
        retrieveTime: 0,
        
        //rudder
        turnSpeed: 0,
        responseTime: 0,
        straighteningSpeed: 0,
        
        //crew
        fireRate: 0,
        accuracy: 0,
        
        //universal
        weight: 0,
    };

    components.body.addToTotalStats(totalStats);
    components.sails.addToTotalStats(totalStats);
    components.cannons.addToTotalStats(totalStats);
    components.head.addToTotalStats(totalStats);
    components.crowsnest.addToTotalStats(totalStats);
    components.anchor.addToTotalStats(totalStats);
    components.rudder.addToTotalStats(totalStats);
    components.crew.addToTotalStats(totalStats);
}



import {calculateShipStats } from './ShipPresets.js';
import { Body, Sails, Cannons, Crew, ... } from './index.js';



const components = {
    body: new Body(scene, 'LVL1'),
    sails: new Sails(scene, 'LVL1'),
    cannons: new Cannons(scene, 'LVL1'),
    head: new Head(scene, 'LVL1'),
    crowsnest: new CrowsNest(scene, 'LVL1'),
    anchor: new Anchor(scene, 'LVL1'),
    rudder: new Rudder(scene, 'LVL1'),
    crew: new Crew(scene, 'LVL1')
};

//calculateShipStats from new JSON

const totalStats = calculateShipStats(components);

console.log('Ship health:', totalStats.maxHealth);
console.log('Ship speed:', totalStats.maxSpeed);
console.log('Ship weight:', totalStats.weight);

//eg
if (totalStats.cannonCount > 0) {
    console.log('Can fire cannons!');
}

//update sails
components.sails = new Sails('LVL2');
const newStats = calculateShipStats(components);

