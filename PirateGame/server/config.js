import { calculateShipStats } from "../public/js/objects/ship-components/calculateComponents.js";

/**
 * Defines server-side constants, such as the tickrate and
 * maximum speeds for players.
 */
export let CONFIG = {
    TICK_RATE: 45,
    NET_TICK_RATE: 20,
    PORT: 3000,

    SHIP: {
        DIMENSIONS: { 
            HEIGHT: 160,
            MIDDLEWIDTH: 200,
            BOWLENGTH: 100,
            STERNRADIUS: 80
        },
        MAX_HEALTH: 0, //set default value in calculateComponents.calculateShipStats() not here (at least for now)
        TURN_SPEED: 0, //set default value in calculateComponents.calculateShipStats() not here (at least for now)
        THRUST: 0, //set default value in calculateComponents.calculateShipStats() not here (at least for now)
        FRICTION_AIR: 0.05, 
        MASS: 0, //set default value in calculateComponents.calculateShipStats() not here (at least for now)
        MAX_SPEED: 0 //set default value in calculateComponents.calculateShipStats() not here (at least for now)
    },
    
    PLAYER: {
        MAX_HEALTH: 100,
        SPEED: 3,
        RADIUS: 15,
        PADDING: 15
    }
};

let configInitialized = false;

/**
 * Initializes ship configuration from component stats.
 * Must be called and awaited before creating ships.
 */
export async function initializeConfig() {
    if (configInitialized) return;
    
    const stats = await calculateShipStats();
    CONFIG.SHIP.MAX_HEALTH = stats.maxHealth;
    CONFIG.SHIP.TURN_SPEED = stats.turnSpeed / 10000;
    CONFIG.SHIP.THRUST = stats.acceleration;
    CONFIG.SHIP.MASS = stats.weight;
    CONFIG.SHIP.MAX_SPEED = stats.maxSpeed;
    
    configInitialized = true;
    console.log('[Config] Ship stats initialized:', {
        turnSpeed: CONFIG.SHIP.TURN_SPEED,
        maxHealth: CONFIG.SHIP.MAX_HEALTH,
        thrust: CONFIG.SHIP.THRUST,
        mass: CONFIG.SHIP.MASS,
        maxSpeed: CONFIG.SHIP.MAX_SPEED
    });
}