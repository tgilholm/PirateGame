import WorldController from "../controllers/world-controller";
import EntityFactory from "../entities/entity-factory";
import { PlayerAction } from "../shared/socket-protocol";
import EntityRegistry from "./entity-registry";
import GameEngine from "./game-engine";


export enum GameMode {
    FREE_FOR_ALL = "FREE_FOR_ALL",  // Players spawn on their own ship
    TEAMS = "TEAMS" // Players spawn on an island with their teammates & a shared ship
}

export interface WorldConfig {
    maxPlayers: number;
    mode: GameMode;
}

export default class World {
    constructor(
        public readonly worldId: string,
        public readonly entityRegistry: EntityRegistry,
        public readonly entityFactory: EntityFactory,
        public readonly gameEngine: GameEngine,
        public readonly worldController: WorldController,
        private readonly config: WorldConfig
    ) { }

    public start() {

    }


    public createPlayer(playerId: string, username: string) {
        const gameMode = this.config.mode;

        // Add via entity factory
        this.entityRegistry.create(this.entityFactory.createPlayer(0, 0, null, username));

        /*
        Free for all- put the player on a ship at a random location
        */
        if (gameMode === GameMode.FREE_FOR_ALL) {

            const randX = Math.random() * 10000;
            const randY = Math.random() * 10000;

            const ship = this.entityFactory.createShip(randX, randY);
            const player = this.entityFactory.createPlayer(0, 0, ship, username);

            // Add both to the registry
            this.entityRegistry.create(ship);
            this.entityRegistry.create(player);
            return;
        }

        if (gameMode === GameMode.TEAMS) {

            return;
        }

    }

    public removePlayer(playerId: string) {
        this.entityRegistry.delete(playerId);
    }

    public handleAction(playerId: string, action: PlayerAction) {
        // Route to world controller
        this.worldController.handle(playerId, action);
    }

    public update(dt: number) {
        // Update game engine every tick
        this.gameEngine.tick(dt);
    }

    public getSnapshot() {
        // Get only what has changed from the game engine
        this.gameEngine.getSnapshot();
    }

    public getFullSync() {

    }
}
