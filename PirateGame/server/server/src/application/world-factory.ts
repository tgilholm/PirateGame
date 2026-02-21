import EntityRegistry from "../engine/entity-registry";
import MessageSystem from "../engine/message-system";
import World from "../engine/world";
import MovementSystem from "../systems/movement-system";
import PhysicsSystem from "../systems/physics-system";
import ProjectileSystem from "../systems/projectile-system";

export default class WorldFactory {


    createWorld(config: any) : World {
        const entityRegistry = new EntityRegistry();

        const systems = {
            physicsSystem: new PhysicsSystem(entityRegistry),
            movementSystem: new MovementSystem(entityRegistry),
            projectileSystem: new ProjectileSystem(entityRegistry),
            messageSystem: new MessageSystem(entityRegistry)
        }

        const world = new World(
            config.id,
            entityRegistry,
            systems
        );
        return world;


    }
}