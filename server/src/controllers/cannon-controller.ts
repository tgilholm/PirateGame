import EntityRegistry from "../engine/entity-registry";
import Projectile from "../entities/projectile";

export default class CannonController {
    private entityRegistry: any;

    constructor(entityRegistry: EntityRegistry) {
        this.entityRegistry = entityRegistry;
    }

    handleInput(player: any, cannon: any): void {
        if (!cannon) return;
        cannon.rotation = player.aimAngle;
    }

    handleFire(player: any, cannon: any): void {

        if (!cannon || !player) return;

        const speed = 500; // you can change this if you want, just testing
        const rotation = cannon.rotation;

        const cannonEndOffset = 20; // distance from the center of the cannon to the tip
        const worldPos = {
            x: cannon.x + Math.cos(rotation) * cannonEndOffset,
            y: cannon.y + Math.sin(rotation) * cannonEndOffset,
        };

        const id = `cannonball_${Date.now()}`;
        const projectile = new Projectile(
            id,
            worldPos.x,
            worldPos.y,
            rotation,
            speed
        )
        );

        this.entityRegistry.add(projectile);
    }

}