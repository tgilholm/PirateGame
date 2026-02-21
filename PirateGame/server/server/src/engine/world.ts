import WorldController from "../controllers/world-controller";
import EntityRegistry from "./entity-registry";
import GameEngine from "./game-engine";




export default class World {
    constructor(
        public readonly entityRegistry: EntityRegistry,
        public readonly gameEngine: GameEngine,
        public readonly worldController: WorldController
    ) {
    }

}
