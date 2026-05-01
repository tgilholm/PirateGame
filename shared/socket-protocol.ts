/*
    Defines the communication protocol between clients and the server. This avoids messy
    "string-based" communication, which is prone to typos
*/

export enum ServerEvent {
	GAME_STATE = 'GAME_STATE',
	INIT_GAME = 'INIT_GAME',
	KICKED = 'KICKED',
	JOIN_FAILED = 'JOIN_FAILED',
	DIG_MINIGAME_START = 'DIG_MINIGAME_START',
	DIG_MINIGAME_RESULT = 'DIG_MINIGAME_RESULT',
	DEAD = 'DEAD',
	SUNK = 'SUNK',
}

export enum ClientEvent {
	READY = 'READY',
	ACTION = 'ACTION',
}

export enum ActionType {
	AIM = 'AIM',
	MOVE = 'MOVE',
	FIRE = 'FIRE',
	UPGRADE = 'UPGRADE',
	MESSAGE = 'MESSAGE',
	INTERACT = 'INTERACT',
	DIG = 'DIG',
	RELEASE = 'RELEASE',
	RESPAWN_SHIP = 'RESPAWN',
	QUIT = 'QUIT',
	BOOST = 'BOOST',
	DASH = 'DASH',
}

export enum TreasureState {
	BURIED = 'BURIED',
	OPENING = 'OPENING',
	DUGUP = 'DUGUP',
	DIGGING = 'DIGGING',
	CARRIED = 'CARRIED',
	DROPPED = 'DROPPED',
	HOLE = 'HOLE',
}

export interface MoveData {
	up: boolean;
	down: boolean;
	left: boolean;
	right: boolean;
	aimAngle: number;
	isSwimming: boolean;
}

export interface UpgradeData {
	name: string;
}

export interface InteractData {
	targetId: string;
	targetType: string;
	parentId?: string | null;
}

export type PlayerAction =
	| { type: ActionType.MOVE; data: MoveData } // Must match interface
	| { type: ActionType.UPGRADE; data: UpgradeData }
	| { type: ActionType.INTERACT; data: InteractData }
	| { type: ActionType.MESSAGE; data?: { text: string } } // the message
	| { type: ActionType.DIG; data?: never } // client doesn't determine if a hit landed
	| { type: ActionType.FIRE; data?: never }
	| { type: ActionType.RELEASE; data?: never }
	| { type: ActionType.QUIT; data?: never }
	| { type: ActionType.RESPAWN_SHIP; data?: never }
	| { type: ActionType.DASH; data?: never }
	| { type: ActionType.BOOST; data?: never };

//types of splash animations -- ui concern only, doesn't need to be sent over the network
export type SplashType =
	| 'cannon-water'
	| 'cannon-land'
	| 'cannon-blood'
	| 'bullet-water'
	| 'bullet-land'
	| 'bullet-blood';

export interface SplashEvent {
	x: number;
	y: number;
	splashType: SplashType;
}

export interface Action {
	playerId: string;
	action: PlayerAction;
}
