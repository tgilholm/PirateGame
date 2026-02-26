/**
 * all proximity-based interactions, checks each frame. measure distance -> show prompt -> handle keypress
 */
export default class InteractionSystem {

    /**
     * @param {*} socket - The socket.io client socket used to emit interaction events.
     */
    constructor(socket) {
        this.socket = socket;
    }

    /**
     * Run every frame from MainScene.update().
     * @param {import("./player.js").default} player - The local player object.
     * @param {string|null} parentId - The ship ID the player is on, or null.
     * @param {Object} ships - All ship instances keyed by id.
     * @param {import("./inputHandler.js").default} inputHandler - For key state queries.
     * @param {import("./UI/createUI.js").default}  ui - For showing interaction prompts.
     * @param {import("./shop.js").default} shop - The world shop object.
     */
    update(player, parentId, ships, inputHandler, ui, shop) {
        if (parentId && ships[parentId]) {
            this.updateOnShip(player, parentId, ships[parentId], inputHandler, ui);
        } else {
            this.updateOffShip(player, ships, inputHandler, ui, shop);
        }
    }

    /**
     * Handles helm and ladder interactions while the player is aboard a ship.
     * @param {*} player
     * @param {string} parentId
     * @param {*} ship
     * @param {*} inputHandler
     * @param {*} ui
     */
    updateOnShip(player, parentId, ship, inputHandler, ui) {
        // Helm — take or release steering control
        const helmDist = ship.getDistanceToHelm(player.sprite.x, player.sprite.y);

        if (helmDist < 30 && !player.isSteering) {
            ui.promptEl.textContent = "(E) Start Steering";
            ui.promptEl.style.display = "block";
            if (inputHandler.justPressed(inputHandler.keys.E)) {
                console.log(`Attempting to take control of ship ${parentId}`);
                this.socket.emit('player:takeControl', { shipId: parentId });
            }
        }

        if (player.isSteering) {
            ui.promptEl.textContent = "(Q) Stop Steering";
            ui.promptEl.style.display = "block";
            if (inputHandler.justPressed(inputHandler.keys.Q)) {
                console.log(`Releasing control of ship ${parentId}`);
                this.socket.emit('player:releaseControl', { shipId: parentId });
            }
        }

        // Ladders — exit ship
        const ladderDists = ship.getLadderLocalDistances(player.sprite.x, player.sprite.y);
        for (const dist of ladderDists) {
            if (dist < 30) {
                ui.promptEl.textContent = "(E) Exit Ship";
                ui.promptEl.style.display = "block";
                if (inputHandler.justPressed(inputHandler.keys.E)) {
                    console.log(`Attempting to exit ship ${parentId}`);
                    this.socket.emit('player:exitShip', { shipId: parentId });
                }
            }
        }
    }

    /**
     * Handles ladder and shop interactions while the player is in the open world.
     * @param {*} player
     * @param {Object} ships
     * @param {*} inputHandler
     * @param {*} ui
     * @param {*} shop
     */
    updateOffShip(player, ships, inputHandler, ui, shop) {
        // Ladders — board a ship
        for (const [shipId, ship] of Object.entries(ships)) {
            const ladderDists = ship.getLadderWorldDistances(player.sprite.x, player.sprite.y);
            if (ladderDists[0] < 30 || ladderDists[1] < 30) {
                ui.promptEl.textContent = "(E) Climb Ladder";
                ui.promptEl.style.display = "block";
                if (inputHandler.justPressed(inputHandler.keys.E)) {
                    console.log(`Attempting to climb ladder on ship ${shipId}`);
                    this.socket.emit('player:enterShip', {
                        shipId,
                        ladderIndex: ladderDists[0] < 30 ? 0 : 1
                    });
                }
            }
        }

        //shop
        shop.update(player, inputHandler.keys, ui);
    }
}
