import Player from "./player.js";
import Ship from "./ship.js";

/**
 * manages all incoming socket events and reads scene properties (cameraTarget, ui, mapWidth, mapHeight)
 */
export default class ClientSocketHandler {

    /**
     * @param {*} socket - the socket.io client socket
     * @param {Phaser.Scene} scene - the active Phaser scene (used to create Phaser objects and access shared state)
     * @param {Object} ships - shared ship registry keyed by id
     * @param {Object} players - shared player registry keyed by id
     */
    constructor(socket, scene, ships, players) {
        this.socket = socket;
        this.scene = scene;
        this.ships = ships;
        this.players = players;
        this.registerEvents();
    }


    registerEvents() {
        const { socket, scene, ships, players } = this;

        //full world state sent once on first connection
        socket.on('initGame', (data) => {
            console.log('[Client] Received initGame', data);

            if (data.shipData && Array.isArray(data.shipData)) {
                data.shipData.forEach(shipData => {
                    if (!ships[shipData.id]) {
                        console.log(`[Client] Creating ship: ${shipData.id}`);
                        ships[shipData.id] = new Ship(scene, shipData.x, shipData.y, shipData.params);
                    }
                });
            }

            if (data.playerData && Array.isArray(data.playerData)) {
                data.playerData.forEach(playerData => {
                    if (!players[playerData.id]) {
                        console.log(`[Client] Creating player: ${playerData.id}`);
                        players[playerData.id] = new Player(scene, playerData.id);
                    }
                    const shipParent = playerData.parentId ? ships[playerData.parentId] : null;
                    players[playerData.id].updateState(playerData, shipParent);
                });
            }

            //snap camera to local player's initial world position
            const localPlayer = players[socket.id];
            if (localPlayer) {
                if (localPlayer.parentId && ships[localPlayer.parentId]) {
                    const worldPos = ships[localPlayer.parentId].getPlayerWorldPos(localPlayer);
                    scene.cameraTarget.x = worldPos.x;
                    scene.cameraTarget.y = worldPos.y;
                } else {
                    scene.cameraTarget.x = localPlayer.sprite.x;
                    scene.cameraTarget.y = localPlayer.sprite.y;
                }
                scene.ui.minimap.initializeMarker(
                    scene.cameraTarget.x, scene.cameraTarget.y,
                    scene.mapWidth, scene.mapHeight
                );
            }
        });

        //delta updates sent every network tick
        socket.on('gameState', (data) => {
            if (data.ships && Array.isArray(data.ships)) {
                data.ships.forEach(shipData => {
                    if (!ships[shipData.id]) {
                        console.log(`[Client] New ship detected: ${shipData.id}`);
                        ships[shipData.id] = new Ship(scene, shipData.x, shipData.y, shipData.params || {});
                    }
                    const ship = ships[shipData.id];
                    ship.target = { x: shipData.x, y: shipData.y, r: shipData.r };
                    ship.velocity = { x: shipData.vx || 0, y: shipData.vy || 0 };
                    ship.angularVelocity = shipData.av || 0;
                });
            }

            data.players.forEach(playerData => {
                if (!players[playerData.id]) {
                    console.log(`[Client] New player joined: ${playerData.id}`);
                    players[playerData.id] = new Player(scene, playerData.id);
                }
                const shipParent = playerData.parentId ? ships[playerData.parentId] : null;
                players[playerData.id].updateState(playerData, shipParent);
            });
        });

        socket.on('controlTaken', () => { players[socket.id].isSteering = true; });
        socket.on('controlReleased', () => { players[socket.id].isSteering = false; });
        socket.on('exitedShip', () => { });
        socket.on('climbedLadder', () => { });
    }
}
