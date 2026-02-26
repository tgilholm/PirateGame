export declare enum ServerEvent {
    GAME_STATE = "GAME_STATE",
    INIT_GAME = "INIT_GAME",
    KICKED = "KICKED",
    JOIN_FAILED = "JOIN_FAILED"
}
export declare enum ClientEvent {
    READY = "PLAYER_READY",
    REQUEST_JOIN = "REQUEST_JOIN",
    REQUEST_SYNC = "REQUEST_SYNC",
    ACTION = "ACTION"
}
export declare enum ActionType {
    MOVE = "MOVE",
    FIRE = "FIRE",
    UPGRADE = "UPGRADE",
    MESSAGE = "MESSAGE",
    INTERACT = "INTERACT",
    DIG = "DIG",
    RELEASE = "RELEASE"
}
export interface MoveData {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}
export interface UpgradeData {
    itemId: string;
}
export type PlayerAction = {
    type: ActionType.MOVE;
    data: MoveData;
} | {
    type: ActionType.UPGRADE;
    data: UpgradeData;
} | {
    type: ActionType.INTERACT;
    data?: never;
} | {
    type: ActionType.MESSAGE;
    data?: {
        text: string;
    };
} | {
    type: ActionType.DIG;
    data?: never;
} | {
    type: ActionType.FIRE;
    data?: never;
} | {
    type: ActionType.RELEASE;
    data?: never;
};
export interface Action {
    playerId: string;
    action: PlayerAction;
}
