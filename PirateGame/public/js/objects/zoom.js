const playerZoom = [2, 1];
const shipZoom = [2, 1, 0.75, 0.55, 0.4];
let playerZoomIndex = 0;
let shipZoomIndex = 0;
let currentVisionRange = 2; // default
let onShip = false;

const zoom = {
    //player enteres/leaves a shipw
    setOnShip(isOnShip) {
        onShip = isOnShip;
        //reset zoom index
        playerZoomIndex = 0;
        shipZoomIndex = 0;
    },

    //when ship components update
    setVisionRange(visionRange) {
        currentVisionRange = Math.max(1, Math.min(visionRange, shipZoom.length));
        
        shipZoomIndex = Math.min(shipZoomIndex, currentVisionRange - 1);
    },

    toggleZoom() {
        if (onShip) {
            shipZoomIndex = (shipZoomIndex + 1) % currentVisionRange;
            return shipZoom[shipZoomIndex];
        } else {
            playerZoomIndex = (playerZoomIndex + 1) % playerZoom.length;
            return playerZoom[playerZoomIndex];
        }
    },

    getZoomValue() {
        if (onShip) {
            return shipZoom[shipZoomIndex];
        } else {
            return playerZoom[playerZoomIndex];
        }
    },
 
    setZoomValue(value) { )
        if (onShip) {
            const idx = shipZoom.indexOf(value);
            if (idx !== -1 && idx < currentVisionRange) shipZoomIndex = idx;
            return shipZoom[shipZoomIndex];
        } else {
            const idx = playerZoom.indexOf(value);
            if (idx !== -1) playerZoomIndex = idx;
            return playerZoom[playerZoomIndex];
        }
    },
};

export default zoom;