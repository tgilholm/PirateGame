import EntityRegistry from "../engine/entity-registry";
import { BaseSystem } from "./base-system";

export default class ProjectileSystem implements BaseSystem {
    constructor(entityRegistry: EntityRegistry) {

    }

    update(dt: number): void {
        // Updates all projectiles in the simulation
        
    }
}