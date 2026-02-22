import * as calculateComponents from "./entities/calculateComponents.js"



export let INIT_CONFIG = {

    SPAWN: { //spawn coordinates
        PLAYER: {// RELATIVE TO SHIP
            X: 0,
            Y: 0
        },
        SHIP: {
            X: 2500,
            Y: 5000
        }
    },

    SHIP: {
        DIMENSIONS: { 
            HEIGHT: 160,
            MIDDLEWIDTH: 200,
            BOWLENGTH: 100,
            STERNRADIUS: 80
        },
        MAX_HEALTH: 0,//set default value in calculateComponents.calculateShipStats() not here (at least for now)
        TURN_SPEED: 0,//set default value in calculateComponents.calculateShipStats() not here (at least for now)
        THRUST: 0,//set default value in calculateComponents.calculateShipStats() not here (at least for now)
        FRICTION_AIR: 0.05, 
        MASS: 0,//set default value in calculateComponents.calculateShipStats() not here (at least for now)
        MAX_SPEED: 0//set default value in calculateComponents.calculateShipStats() not here (at least for now)
    },
    
    PLAYER: {
        MAX_HEALTH: 100,
        SPEED: 3,           // Speed on ship and land
        SWIM_SPEED: 50,    // Speed swimming 
        RADIUS: 15,
        PADDING: 15
    }

};

let configInitialized = false;

/*
 * Initializes ship INIT_CONFIGuration from component stats.
 * Must be called and awaited before creating ships.
 */
export async function initConfig() {
    if (configInitialized) return;
    
    const stats = await calculateComponents.calculateShipStats();
    INIT_CONFIG.SHIP.MAX_HEALTH = stats.maxHealth;
    INIT_CONFIG.SHIP.TURN_SPEED = stats.turnSpeed / 10000;
    INIT_CONFIG.SHIP.THRUST = stats.acceleration;
    INIT_CONFIG.SHIP.MASS = stats.weight;
    INIT_CONFIG.SHIP.MAX_SPEED = stats.maxSpeed;
    
    configInitialized = true;
    console.log('[INIT_CONFIG] Ship stats initialized:', {
        turnSpeed: INIT_CONFIG.SHIP.TURN_SPEED,
        maxHealth: INIT_CONFIG.SHIP.MAX_HEALTH,
        thrust: INIT_CONFIG.SHIP.THRUST,
        mass: INIT_CONFIG.SHIP.MASS,
        maxSpeed: INIT_CONFIG.SHIP.MAX_SPEED
    });
}