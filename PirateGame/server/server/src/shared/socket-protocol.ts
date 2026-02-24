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
    READY = 'PLAYER_READY',
    REQUEST_JOIN = 'REQUEST_JOIN',
    REQUEST_SYNC = 'REQUEST_SYNC',
    ACTION = 'ACTION'
}

export enum ActionType {
    MOVE = 'MOVE',
    FIRE = 'FIRE',
    UPGRADE = 'UPGRADE',
    MESSAGE = 'MESSAGE',
    INTERACT = 'INTERACT',
    DIG = 'DIG'
}

export interface MoveData {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}

export interface UpgradeData {
    itemId: string
}

export type PlayerAction =
    | { type: ActionType.MOVE; data: MoveData }   // Must match interface
    | { type: ActionType.UPGRADE; data: UpgradeData }
    | { type: ActionType.INTERACT; data?: never } // Cannot provide data
    | { type: ActionType.MESSAGE; data?: { text: string } } // the message
    | { type: ActionType.DIG; data?: never }
    | { type: ActionType.FIRE; data?: never };


export interface Action {
    playerId: string;
    action: PlayerAction;
}