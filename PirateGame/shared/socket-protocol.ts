// WHERE an event is happening
export enum Domain {
    PLAYER = 'player',
    SHIP = 'ship',
    SYSTEM = 'system',
    WORLD = 'world'
}

// WHAT is happening
export enum Action {
    JOIN = 'join',
    READY = 'ready',
    SYNC = 'sync',
    
    MOVE = 'move',
    INTERACT = 'interact',
    UPGRADE = 'upgrade',
    FIRE = 'fire'
}