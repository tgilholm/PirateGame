import InteractableEntity from "src/entities/interactable-entity";
import Player from "src/entities/player";
import Ship from "src/entities/ship";

export default class InteractionHandler {

    constructor() { }

    handleHelmInteraction(player: Player, ship: Ship, helm: { x: number, y: number }) {
        if (!player.parent) return;
        player.isSteering = true;

        if (ship.pilot) return; // Ship already has a pilot
        ship.pilot = player;

        // Move player just behind the helm
        player.x = helm.x - 25;
        player.y = helm.y;
    }

    handleCannonInteraction(player: Player, cannon: { x: number, y: number }) {
        if (!player.parent) return;
        player.isUsingCannon = true;

        const cannonYdir = cannon.y > 0 ? -1 : 1;

        player.x = cannon.x;
        player.y = cannon.y + cannonYdir * 25;
    }

    handleLadderInteraction(player: Player, ship: Ship, ladder: { x: number, y: number }) {
        // Not on ship
        if (!player.parent) {
            const enterYdir = ladder.y > 0 ? -1 : 1;    // which side the ladder is on
            player.x = ladder.x;
            player.y = ladder.y + enterYdir * 30;   // move player inside hitbox

            player.parent = ship;
        } else {
            const exitYdir = ladder.y > 0 ? 1 : -1;

            const worldPos = ship.localToWorld(ladder.x, ladder.y);

            player.x = worldPos.x;
            player.y = worldPos.y + exitYdir * 50;

            player.parent = null;
        }
    }

    handleRelease(player: Player, ship: Ship | null) {
        if (player.isSteering)
        {
            if (ship)
            {
                if (ship.pilot !== player) return;

                ship.pilot = null;
                player.isSteering = false;
            }
        }

        if (player.isUsingCannon)
        {
            player.isUsingCannon = false;
        }
    }


}