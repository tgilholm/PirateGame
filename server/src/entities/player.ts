import { PlayerConfig } from '../types';
import Entity from './entity';
import Cannon from './interactables/cannon';
import Ship from './ship';

/**
 * The server-side representation of an individual player's state, acting as the "source of truth"
 * for each player in the game.
 */
export default class Player extends Entity {
	username: string;
	isSteering: boolean;
	cannon: Cannon | null;
	isCarrying: boolean;
	carryingTreasureId: string | null = null;
	ship: Ship; // the player's own ship
	gold: number = 0;
	inputs: {
		up: boolean;
		down: boolean;
		left: boolean;
		right: boolean;
	};
	aimAngle: number;
	reloadTime: number = 1000;
	reloadTimer: number = 0;

	respawnTime: number = 5000;
	respawnTimer: number = 0;
	respawnStarted: boolean = false;

	/**
	 * Builds a player with the specified data
	 * @param id the id of the player
	 * @param x the (relative/absolute) x coordinate
	 * @param y the (relative/absolute) y coordinate
	 * @param parent the optional physics parent of this player
	 * @param username chosen by the player
	 * @param config config data read from entityConfig
	 */
	constructor(id: string, x: number, y: number, parent: Entity | null, username: string, config: PlayerConfig) {
		super(id, 'player', x, y, config.maxHealth, parent);
		this.username = username || ''; // default to no uname
		this.gold = config.startingGold || 0; // default to 0 gold

		// Player-specific detail
		this.ship = parent as Ship;
		this.isSteering = false;
		this.cannon = null; // not using cannon to start
		this.isCarrying = false;
		this.carryingTreasureId = null;

		// Where the player is aiming
		this.aimAngle = 0;

		// Input from the client
		this.inputs = {
			up: false,
			down: false,
			left: false,
			right: false,

			// Specify any other player inputs here
		};
	}

	get isReloaded(): boolean {
		return this.reloadTimer <= 0;
	}

	/**
	 * Override base method appending player-specific data for network transmission
	 */
	toState(): any {
		/*
            ... - spread operator. Prepends all base entity data:
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            r: this.r,
            health: this.health,
            maxHealth: this.maxHealth
        */
		// Send everything the client needs to display the player
		return {
			...super.toState(),
			username: this.username,
			gold: this.gold,
			isSteering: this.isSteering,
			aimAngle: this.aimAngle,
			isUsingCannon: !!this.cannon, // convert to true/false
			reloadTimer: this.reloadTimer,
			reloadTime: this.reloadTime,
			isCarrying: this.isCarrying,
			carryingTreasureId: this.carryingTreasureId,
			respawnTimer: this.respawnTimer,
			shipId: this.ship.id,
		};
	}
}
