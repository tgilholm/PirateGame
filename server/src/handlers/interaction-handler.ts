import Cannon from "../entities/interactables/cannon";
import Helm from "../entities/interactables/helm";
import InteractableEntity from "../entities/interactables/interactable-entity";
import Ladder from "../entities/interactables/ladder";
import Player from "../entities/player";
import Ship from "../entities/ship";

/**
 * Handler class- provides methods for each type of player interaction with interactable entities,
 * for example cannons, helms, treasure chests etc. 
 */
export default class InteractionHandler {

    /**
     * Handles the interaction of a player with a helm object, and therefore take control of the ship
     * by resetting the ship's pilot to that player. Only allows the interaction if the player is on
     * the ship, and the ship is not already being controlled
     * @param player the player doing the interaction
     * @param ship the ship the interactable is on
     * @param helm the helm being interacted with
     */
    handleHelmInteraction(player: Player, ship: Ship, helm: Helm) {
        // Player not on ship or ship already being piloted
        if (!player.parent || ship.pilot || helm.user) return;

        helm.user = player;
        ship.pilot = player;
        player.isSteering = true;
        

        // Move player just behind the helm
        player.x = helm.x - 25;
        player.y = helm.y;
    }

    /**
     * Handles the interaction of a player with a cannon object. If successful, sets the player as the 
     * user of the cannon, and moves them slightly behind it
     * @param player the player doing the interaction
     * @param cannon the cannon being interacted with
     */
    handleCannonInteraction(player: Player, cannon: Cannon) {
        if (!player.parent || cannon.user) return;  // cannon must be free

        const cannonYdir = cannon.y > 0 ? -1 : 1;

        player.x = cannon.x;
        cannon.user = player;
        player.cannon = cannon;
        player.y = cannon.y + cannonYdir * 25;  // move the player behind the cannon
    }

    /**
     * Handles the interaction of a player and a ladder object. Ladders can be interacted with both
     * on and off ships. If on a ship, the ladder takes them off it, with a slight normalised "push"
     * outward of the ship to clear the physics boundary, and vice versa
     * @param player the player doing the interaction
     * @param ship the ship the ladder is on
     * @param ladder the ladder being interacted with
     */
    handleLadderInteraction(player: Player, ship: Ship, ladder: Ladder) {

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

    /**
     * Ends any continued interaction a player currently has with an interactable object. If the player
     * was controlling a helm, they are removed from the ship's pilot too
     * @param player the player releasing an interactable
     * @param ship the ship (if any) the interactable is on
     * @param interactable the interactable (if any) the player wants to release
     */
    handleRelease(player: Player, ship: Ship | null, interactable: InteractableEntity | null) {

        if (!interactable || interactable.user !== player) return; // player can only release if using

        interactable.user = null;

        switch (interactable.type) {
            case 'helm':
                if (!ship) return;
                player.isSteering = false;
                ship.pilot = null;  // reset pilot
                break;

            case 'cannon':
                player.cannon = null;
                break;
        }
    }
}