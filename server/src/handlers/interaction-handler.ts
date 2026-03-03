import InteractableEntity from "src/entities/interactable-entity";
import Player from "src/entities/player";
import Ship from "src/entities/ship";

export default class InteractionHandler {

    constructor() { }

    handleHelmInteraction(player: Player, ship: Ship, helm: InteractableEntity) {
        // Player not on ship or ship already being piloted
        if (!player.parent || ship.pilot || helm.user) return;

        helm.user = player;
        ship.pilot = player;
        player.isSteering = true;

        // Move player just behind the helm
        player.x = helm.x - 25;
        player.y = helm.y;
    }

    handleCannonInteraction(player: Player, cannon: InteractableEntity) {
        if (!player.parent || cannon.user) return;

        const cannonYdir = cannon.y > 0 ? -1 : 1;

        player.x = cannon.x;
        cannon.user = player;
        player.isUsingCannon = true;
        player.y = cannon.y + cannonYdir * 25;
    }

    handleLadderInteraction(player: Player, ship: Ship, ladder: InteractableEntity) {

        if (!player.parent) {
            const enterYdir = ladder.y > 0 ? -1 : 1;

            player.x = ladder.x;
            player.y = ladder.y + (enterYdir * 20);

            player.parent = ship;
        } else {
            const dist = Math.sqrt(ladder.x * ladder.x + ladder.y * ladder.y);
            const dirX = ladder.x / dist;
            const dirY = ladder.y / dist;

            const exitPadding = 40;
            const shuntLocalX = ladder.x + (dirX * exitPadding);
            const shuntLocalY = ladder.y + (dirY * exitPadding);
            const shuntGlobal = ship.localToWorld(shuntLocalX, shuntLocalY);

            player.x = shuntGlobal.x;
            player.y = shuntGlobal.y;
            player.parent = null;
        }
    }

    handleRelease(player: Player, ship: Ship | null, interactable: InteractableEntity | null) {

        if (!interactable || interactable.user !== player) return; // player can only release if using

        interactable.user = null;

        switch (interactable.useType) {
            case 'helm':
                if (!ship) return;
                player.isSteering = false;
                ship.pilot = null;  // reset pilot
                break;

            case 'cannon':
                player.isUsingCannon = false;
                break;
        }
    }


}