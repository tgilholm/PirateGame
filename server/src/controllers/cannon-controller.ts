import Cannon from "src/entities/cannon";
import EntityRegistry from "../engine/entity-registry";
import Projectile from "../entities/projectile";
import { MoveData } from "@shared/socket-protocol";
import Entity from "src/entities/entity";
import Ship from "src/entities/ship";

export default class CannonController {


    constructor(private entityRegistry: EntityRegistry) { }

    handleMove(cannon: Cannon, data: MoveData): void {
        if (!cannon) return;
        cannon.targetAngle = data.aimAngle;
    }

    handleFire(cannon: Cannon): void {
        if (!cannon) return;

        const speed = 500; // you can change this if you want, just testing
        const rotation = cannon.r; // current angle, not target

        const cannonEndOffset = 20; // distance from the center of the cannon to the tip
        const matrix = this.getWorldPosition(cannon);

        const worldPos = {
            x: matrix.x + Math.cos(rotation) * cannonEndOffset,
            y: matrix.y + Math.sin(rotation) * cannonEndOffset,
        };

        const id = `cannonball_${Date.now()}`;
        const projectile = new Projectile(
            id,
            worldPos.x,
            worldPos.y,
            rotation,
            speed
        );

        console.log(projectile.x, projectile.y)

        this.entityRegistry.create(projectile);
    }

    /**
     * Helper method to get the absolute coordinates of an entity if they are on a ship.
     * @param entity the entity for which to find the absolute coordinates
     * @returns 
     */
    private getWorldPosition(entity: Entity) {
        if (!entity.parent) {
            // If the entity has no parent, its coordinates are already in world space
            return { x: entity.x, y: entity.y };
        }

        const parent = this.entityRegistry.get<Ship>(entity.parent.id);

        // If the parent is a ship, use its localToWorld method
        if (parent) {
            const ship = parent as Ship;
            return ship.localToWorld(entity.x, entity.y);
        }

        // If the parent is not a ship, return the entity's local position
        return { x: entity.x, y: entity.y };
    }
}