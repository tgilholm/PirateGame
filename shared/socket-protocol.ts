/*
    Defines the communication protocol between clients and servers. This avoids messy
    "string-based" communication, which is prone to typos
*/

export enum ServerEvent {
	GAME_STATE = 'GAME_STATE',
	INIT_GAME = 'INIT_GAME',
	KICKED = 'KICKED',
	JOIN_FAILED = 'JOIN_FAILED',
	DIG_MINIGAME_START = 'DIG_MINIGAME_START',
	DIG_MINIGAME_RESULT = 'DIG_MINIGAME_RESULT',
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
	TREASURE_INTERACT = 'TREASURE_INTERACT',
}

export interface MoveData {
	up: boolean;
	down: boolean;
	left: boolean;
	right: boolean;
	aimAngle: number;
}

export interface UpgradeData {
	itemId: string;
}

export interface InteractData {
	targetId: string;
	targetType: string;
	parentId?: string | null;
}

export interface DigData {
	mode: 'start' | 'hit';
	sliderPosition?: number; // 0..1, only used for mode === "hit"
}

export type PlayerAction =
	| { type: ActionType.MOVE; data: MoveData } // Must match interface
	| { type: ActionType.UPGRADE; data: UpgradeData }
	| { type: ActionType.INTERACT; data: InteractData }
	| { type: ActionType.TREASURE_INTERACT }
	| { type: ActionType.MESSAGE; data?: { text: string } } // the message
	| { type: ActionType.DIG; data: DigData }
	| { type: ActionType.FIRE; data?: never }
	| { type: ActionType.RELEASE; data?: never };

//types of splash animations
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
