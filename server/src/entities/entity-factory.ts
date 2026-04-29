import EntityRegistry from '../engine/entity-registry';
import { EntityConfig, InteractableInstance, NPCShipConfig, PlayerConfig, ShipConfig, UpgradeConfig } from '../types';
import Entity from './entity';
import Player from './player';
import Ship from './ship';
import Shop from './shop';
import Interactable from './interactables/interactable';
import Cannon from './interactables/cannon';
import Ladder from './interactables/ladder';
import Helm from './interactables/helm';
import NPC from './npcs/npc';
import NPCShip from './npcs/npc-ship';
import Treasure from './interactables/treasure';
import Money from './interactables/money';
import Cannonball from './projectiles/cannonball';
import PalmTree from './interactables/palm-tree';
import Coconut from './interactables/coconut';
import Barrel from './interactables/barrel';
import Bandage from './interactables/bandage';

/**
 * Aggregates entity creation, applying domain-specific default values from
 * the entity-config.json.
 */
export default class EntityFactory {
	playerConfig: PlayerConfig;
	shipConfig: ShipConfig;
	upgradeConfig: UpgradeConfig;
	npcShipConfig: NPCShipConfig;

	/**
	 * Builds an entity factory
	 * @param entityConfig the default data for new entities
	 * @param entityRegistry the repository of entities to add to
	 */
	constructor(
		entityConfig: EntityConfig,
		upgradeConfig: UpgradeConfig,
		private entityRegistry: EntityRegistry
	) {
		this.playerConfig = entityConfig.player;
		this.shipConfig = entityConfig.ship; // destructure
		this.npcShipConfig = entityConfig.npcShip;
		this.upgradeConfig = upgradeConfig;
	}

	/**
	 * Creates a player with the specified data, injects the default player config and adds to the entity registry
	 * @param id the id of the player
	 * @param x the starting x of the player (relative if parent != null)
	 * @param y the starting y of the player (relative if parent != null)
	 * @param parent an optional physics parent entity
	 * @param username the username chosen by the player
	 * @returns the player
	 */
	public createPlayer(
		id: string,
		x: number,
		y: number,
		parent: Entity | null,
		username: string,
		pirateColour: string = 'default'
	): Player {
		const player = new Player(id, x, y, parent, username, this.playerConfig, pirateColour);
		this.entityRegistry.create(player);
		return player;
	}

	/**
	 * Creates a ship with the specified data, injects the default ship config and adds to the entity registry. Note
	 * that this does not add a matter-js physics body to the world yet.
	 * @param id the id of the ship
	 * @param x the absolute x coordinate of the ship
	 * @param y the absolute y coordinate of the ship
	 * @returns the ship
	 */
	public createShip(id: string, x: number, y: number): Ship {
		const ship = new Ship(id, 'ship', x, y, this.shipConfig, this.upgradeConfig);
		this.entityRegistry.create(ship);

		this.shipConfig.interactables.forEach((item, index) => {
			this.createInteractable(ship, item, index);
		});

		return ship;
	}

	public createTreasure(id: string, x: number, y: number, goldValue: number): Treasure {
		const treasure = new Treasure(id, x, y, goldValue);
		this.entityRegistry.create(treasure);
		return treasure;
	}

	public createInteractable(parent: Ship | null, instance: InteractableInstance, index: number | string) {
		const { type, x, y } = instance;
		const prefix = parent ? parent.id : 'map'; // parent id or map if null
		const id = `${prefix}_${type}_${index}`;

		let item: Interactable;

		switch (type) {
			case 'cannon':
				item = new Cannon(id, x, y, parent);
				break;
			case 'ladder':
				item = new Ladder(id, x, y, parent);
				break;
			case 'helm':
				item = new Helm(id, x, y, parent);
				break;
			case 'shop':
				item = new Shop(id, x, y);
				break;
			case 'money':
				item = new Money(id, x, y, parent);
				break;
			case 'palm-tree':
				item = new PalmTree(id, x, y);
				break;
			case 'coconut':
				item = new Coconut(id, x, y, instance.treeId ?? '');
				break;
			case 'barrel':
				item = new Barrel(id, x, y);
				break;
			case 'bandage':
				item = new Bandage(id, x, y);
				break;

			default:
				item = new Interactable(id, x, y, parent);
		}

		if (parent) {
			parent.interactables.push(item);
		}
		this.entityRegistry.create(item);
		return item;
	}

	public createNPC(id: string, x: number, y: number): NPC {
		const npc = new NPC(id, 'npc', x, y);
		this.entityRegistry.create(npc);
		return npc;
	}

	public createNPCShip(id: string, x: number, y: number): NPCShip {
		const npcShip = new NPCShip(id, x, y, this.npcShipConfig, this.upgradeConfig);
		this.entityRegistry.create(npcShip);

		this.npcShipConfig.interactables.forEach((item, index) => {
			this.createInteractable(npcShip, item, index);
		});
		return npcShip;
	}

	public createCannonball(
		x: number,
		y: number,
		r: number,
		speed: number,
		damage: number,
		parentV: { x: number; y: number },
		origin: Cannon,
		index: number // so each cannonball doesn't have the same ID
	): Cannonball {
		const ball = new Cannonball(`cannonball_${Date.now()}_${index}`, x, y, r, speed, damage);

		ball.vx += parentV.x;
		ball.vy += parentV.y;
		ball.firedBy = origin;

		this.entityRegistry.create(ball);
		return ball;
	}

	public createBarrel(id: string, x: number, y: number): Barrel {
		const barrel = new Barrel(id, x, y);
		this.entityRegistry.create(barrel);
		return barrel;
	}

	public createCoconut(id: string, x: number, y: number, treeId: string): Coconut {
		const coconut = new Coconut(id, x, y, treeId);
		this.entityRegistry.create(coconut);
		return coconut;
	}

	public createBandage(id: string, x: number, y: number): Bandage {
		const bandage = new Bandage(id, x, y);
		this.entityRegistry.create(bandage);
		return bandage;
	}

	public createPalmTree(id: string, x: number, y: number): PalmTree {
		const tree = new PalmTree(id, x, y);
		this.entityRegistry.create(tree);
		return tree;
	}
}
