const ZOOM_LEVELS = [1, 0.5, 2];
let zoomIndex = 0;

const zoom = {
    toggleZoom() {
        zoomIndex = (zoomIndex + 1) % ZOOM_LEVELS.length;
        return ZOOM_LEVELS[zoomIndex];
    },

    getZoomValue() {
        return ZOOM_LEVELS[zoomIndex];
    },

    setZoomValue(value) {
        const idx = ZOOM_LEVELS.indexOf(value);
        if (idx !== -1) zoomIndex = idx;
        return ZOOM_LEVELS[zoomIndex];
    },

};

export default zoom;