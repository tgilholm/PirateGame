import Ship from "src/entities/ship";
import EntityRegistry from "../engine/entity-registry";
import Player from "../entities/player";
import UpgradeHandler from "../handlers/upgrade-handler";
import { InteractData, MoveData, UpgradeData } from "@shared/socket-protocol";
import InteractableEntity from "src/entities/interactable-entity";
import InteractionHandler from "src/handlers/interaction-handler";
import Entity from "src/entities/entity";

export default class PlayerController {

    constructor(private entityRegistry: EntityRegistry,
        private interactionHandler: InteractionHandler,
        private upgradeHandler: UpgradeHandler
    ) {
    }


    handleMove(player: Player, data: MoveData): void {
        player.inputs.up = data.up;
        player.inputs.down = data.down;
        player.inputs.left = data.left;
        player.inputs.right = data.right;
        player.aimAngle = data.aimAngle;
    }


    handleInteract(player: Player, data: InteractData): void {
        const interactable = this.entityRegistry.get<InteractableEntity>(data.targetId);

        if (!interactable) return;  // couldn't find interactable

        const interactableWorldPos = this.getWorldPosition(interactable);
        const playerWorldPos = this.getWorldPosition(player);

        if (!interactableWorldPos || !playerWorldPos) {
            return;
        }
        const dist = Math.sqrt(
            Math.pow(playerWorldPos.x - interactableWorldPos?.x, 2) +
            Math.pow(playerWorldPos.y - interactableWorldPos?.y, 2)
        )


        if (dist < 50) {
            const ship = interactable.parent as Ship;
            if (!ship) return;
            switch (interactable.useType) {
                case 'helm':
                    this.interactionHandler.handleHelmInteraction(player, ship, interactable);
                    break;

                case 'cannon':
                    this.interactionHandler.handleCannonInteraction(player, interactable);
                    break;
                case 'ladder':

                    this.interactionHandler.handleLadderInteraction(player, ship, interactable);
                    break;
                default:
                    return;
            }
        }
    }


    handleRelease(player: Player): void {
        // Get the interactable currently being used by the player
        const interactables = this.entityRegistry.getByType<InteractableEntity>('interactable');
        let interactable = null;

        for (let i = 0; i < interactables.length; i++)
        {
            if (interactables[i].user === player)
            {
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
        throw new Error("Method not implemented.");
    }
    handleCannonFire(player: Player) {
        throw new Error("Method not implemented.");
    }
    handleUpgrade(player: Player, data: UpgradeData) {
        throw new Error("Method not implemented.");
    }

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