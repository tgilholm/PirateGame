/*
    Defines the communication protocol between clients and servers. This avoids messy
    "string-based" communication, which is prone to typos
*/

export enum ServerEvent {
    GAME_STATE = 'GAME_STATE',
    INIT_GAME = 'INIT_GAME',
    KICKED = 'KICKED',
    JOIN_FAILED = 'JOIN_FAILED'
}

export enum ClientEvent {
    PLAYER_READY = 'PLAYER_READY',
    PLAYER_REQUEST_JOIN = 'PLAYER_REQUEST_JOIN',
    PLAYER_REQUEST_SYNC = 'PLAYER_REQUEST_SYNC',
    PLAYER_ACTION = 'PLAYER_ACTION'
}