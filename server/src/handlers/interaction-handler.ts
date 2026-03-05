import InteractableEntity from "src/entities/interactable-entity";
import Player from "src/entities/player";
import Ship from "src/entities/ship";
import Shop from "src/entities/shop";

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

    handleShopInteraction(player: Player, shop: InteractableEntity) {
        if (shop.useType !== "shop") return;

            //launch shop


    }
}
