export let CONFIG = {

    TICK_RATE: 45,
    NET_TICK_RATE: 20,
    PORT: 3000,

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
        MAX_HEALTH:250,
        CREW_CAPACITY:5,
        ACCELERATION:0.1,
        MAX_SPEED:100,
        CANNON_DAMAGE:100,
        CANNON_RANGE:10,
        CANNON_COUNT:2,
        RAMMING_POWER:10,
        MINIMAP_RANGE:10,
        VISION_RANGE:10,
        STOP_POWER:10,
        DEPLOY_TIME:5,
        RETRIEVE_TIME:5,
        TURN_SPEED:50,
        RESPONSE_TIME:5,
        FIRE_RATE: 5,
        ACCURACY: 20,
        WEIGHT: 100,
        FRICTION_AIR: 0.05, 
        //MASS: 0, //can replace weight?
        //THRUST: 0, // can replace acceleration?
    },
    
    PLAYER: {
        MAX_HEALTH: 100,
        SPEED: 3,           // Speed on ship and land
        SWIM_SPEED: 50,    // Speed swimming 
        RADIUS: 15,
        PADDING: 15
    },

    SHOP: {
        X: 2600,
        Y: 5100
    }

};
