/**
 * Defines server-side constants, such as the tickrate and
 * maximum speeds for players.
 */
export const CONFIG = {
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
        MAX_HEALTH: 1000,
        TURN_SPEED: 0.0003,
        THRUST: 0.15,
        FRICTION_AIR: 0.05,
        MASS: 200
    },
    
    PLAYER: {
        MAX_HEALTH: 100,
        SPEED: 3,
        RADIUS: 15,
        PADDING: 15
    }
};