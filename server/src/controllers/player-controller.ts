import Ship from "../entities/ship";
import EntityRegistry from "../engine/entity-registry";
import Player from "../entities/player";
import UpgradeHandler from "../handlers/upgrade-handler";
import { InteractData, MoveData, UpgradeData } from "@shared/socket-protocol";
import InteractableEntity from "../entities/interactables/interactable-entity";
import InteractionHandler from "../handlers/interaction-handler";
import Entity from "../entities/entity";
import Projectile from "../entities/projectiles/projectile";
import Cannon from "../entities/interactables/cannon";
import Helm from "../entities/interactables/helm";
import Ladder from "../entities/interactables/ladder";
import Bullet from "../entities/projectiles/bullet";

/**
 * Handles events affecting the player
 */
export default class PlayerController {

    /**
     * Creates the player controller
     * @param entityRegistry to reference the entities in the game
     * @param interactionHandler delegates interaction specifics
     * @param upgradeHandler delegates upgrade specifics
     */
    constructor(private entityRegistry: EntityRegistry,
        private interactionHandler: InteractionHandler,
        private upgradeHandler: UpgradeHandler
    ) {
    }

    /**
     * Handles the movement of this player- this method should only be invoked
     * if the player is not controlling a ship or cannon
     * @param player the player for which to update the inputs
     * @param data the inputs matching MoveData
     */
    handleMove(player: Player, data: MoveData): void {
        player.inputs.up = data.up;
        player.inputs.down = data.down;
        player.inputs.left = data.left;
        player.inputs.right = data.right;
        player.aimAngle = data.aimAngle;
    }

    /**
     * Handles the interaction of this player with an interactable object. Checks if the object
     * is close enough to the player, and if they are, delegates to the interaction handler
     * @param player the player interacting with an object
     * @param data the data matching InteractData, containing the id of the target interactable
     */
    handleInteract(player: Player, data: InteractData): void {
        const interactable = this.entityRegistry.get<InteractableEntity>(data.targetId);

        if (!interactable) return;  // couldn't find interactable

        const interactableWorldPos = this.getWorldPosition(interactable);
        const playerWorldPos = this.getWorldPosition(player);

        if (!interactableWorldPos || !playerWorldPos) {
            return;
        }

        // Distance between player and interactable
        const dist = Math.sqrt(
            Math.pow(playerWorldPos.x - interactableWorldPos?.x, 2) +
            Math.pow(playerWorldPos.y - interactableWorldPos?.y, 2)
        )

        if (dist < 50) {
            const ship = interactable.parent as Ship;
            if (!ship) return;
            switch (interactable.type) {
                case 'helm':
                    this.interactionHandler.handleHelmInteraction(player, ship, interactable as Helm);
                    break;

                case 'cannon':
                    this.interactionHandler.handleCannonInteraction(player, interactable as Cannon);
                    break;
                case 'ladder':
                    this.interactionHandler.handleLadderInteraction(player, ship, interactable as Ladder);
                    break;
                default:
                    return;
            }
        }
    }

    /**
     * Handles players releasing an interactable that they are using.
     * @param player the player to handle the release event for
     */
    handleRelease(player: Player): void {
        // Get all interactables
        const interactables = this.entityRegistry.getByType<InteractableEntity>('interactable');
        let interactable = null;

        // Find that interactable
        for (let i = 0; i < interactables.length; i++) {
            if (interactables[i].user === player) {
                interactable = interactables[i];
            }
        }

        // Find the parent if the interactable has one
        const ship = interactable?.parent as Ship || null;

        this.interactionHandler.handleRelease(player, ship, interactable);
    }


    handleDig(player: Player) {
        throw new Error("Method not implemented.");
    }
    handleGunFire(player: Player) {
        // Wait until reloaded
        if (!player || !player.isReloaded) return;

        // Reset reload timer
        player.reloadTimer = player.reloadTime;

        // Get player world pos
        const worldPos = this.getWorldPosition(player);

        const bullet = new Bullet(`bullet_${Date.now()}_${player.id}`, worldPos.x, worldPos.y, player.aimAngle);
        bullet.vx += player.vx;
        bullet.vy += player.vy;
        bullet.firedBy = player;

        // Add to the entity registry
        this.entityRegistry.create(bullet);
    }

    handleUpgrade(player: Player, data: UpgradeData) {
        throw new Error("Method not implemented.");
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